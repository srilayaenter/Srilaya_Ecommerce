import { prisma } from "../../../../lib/db";
import { sendEmail } from "../../../../lib/email";
import { redirect } from "next/navigation";

async function retryEmail(formData: FormData) {
  'use server';

  const id = formData.get('id') as string;
  const failed = await prisma.failedEmail.findUnique({ where: { id } });

  if (!failed) {
    redirect('/admin/failed-emails');
  }

  const result = await sendEmail({
    to: failed.to,
    subject: failed.subject,
    html: failed.html,
    context: failed.context || undefined,
  });

  if (result.success) {
    await prisma.failedEmail.update({
      where: { id },
      data: { resolved: true, retriedAt: new Date() }
    });
  } else {
    await prisma.failedEmail.update({
      where: { id },
      data: { retriedAt: new Date() }
    });
  }

  redirect('/admin/failed-emails');
}

export default async function FailedEmailsPage() {
  const failedEmails = await prisma.failedEmail.findMany({
    where: { resolved: false },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Failed Emails</h1>

      {failedEmails.length === 0 ? (
        <p className="text-gray-600">No failed emails. Good.</p>
      ) : (
        <div className="space-y-4">
          {failedEmails.map(email => (
            <div key={email.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{email.subject}</p>
                  <p className="text-sm text-gray-600">To: {email.to}</p>
                  {email.context && (
                    <p className="text-sm text-gray-500">Context: {email.context}</p>
                  )}
                  <p className="text-sm text-red-600 mt-1">Error: {email.errorMessage}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Failed at {new Date(email.createdAt).toLocaleString('en-IN')}
                    {email.retriedAt && ` · Last retry ${new Date(email.retriedAt).toLocaleString('en-IN')}`}
                  </p>
                </div>
                <form action={retryEmail}>
                  <input type="hidden" name="id" value={email.id} />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    Retry
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}