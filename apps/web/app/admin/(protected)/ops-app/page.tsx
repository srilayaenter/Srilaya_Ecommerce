export default function OpsAppDownloadPage() {
  return (
    <div className="space-y-6 font-sans max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#212121]">SriLaYa Ops App</h1>
        <p className="text-sm text-[#8D6E63] mt-1">
          Internal Android app for kitchen &amp; workshop batch scaling. Staff only — don&apos;t share this link outside the team.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#E0E0E0] p-6 space-y-4">
        <div className="text-sm text-[#212121] space-y-2">
          <p>Install on an Android phone:</p>
          <ol className="list-decimal list-inside space-y-1 text-[#5D4037]">
            <li>Tap the download button below on the phone itself (or transfer the file over).</li>
            <li>Open the downloaded file. Android may ask to allow &quot;install unknown apps&quot; for whichever app you used — allow it.</li>
            <li>You may see a Play Protect warning since this isn&apos;t distributed via the Play Store — that&apos;s expected, tap &quot;Install anyway&quot;.</li>
          </ol>
        </div>
        <a
          href="/api/admin/ops-app-download"
          className="inline-block bg-[#006A38] hover:bg-[#00522B] text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          📲 Download SriLaYa Ops (Android)
        </a>
      </div>
    </div>
  );
}
