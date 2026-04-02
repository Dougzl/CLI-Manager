import { useEffect } from "react";
import { RefreshCw, Check, AlertCircle, Download, ExternalLink } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useUpdateStore } from "../../stores/updateStore";

export function AboutSection() {
  const {
    currentVersion,
    checking,
    updateAvailable,
    updateInfo,
    error,
    fetchVersion,
    checkUpdate,
    reset,
  } = useUpdateStore();

  useEffect(() => {
    if (!currentVersion) {
      fetchVersion();
    }
  }, [currentVersion, fetchVersion]);

  const handleCheckUpdate = () => {
    if (checking) return;
    checkUpdate();
  };

  const handleOpenDownload = async () => {
    if (updateInfo?.downloadUrl) {
      try {
        await openUrl(updateInfo.downloadUrl);
      } catch (e) {
        console.error("Failed to open download URL:", e);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="ui-surface-card rounded-2xl border border-border p-4">
      <div className="text-sm font-semibold text-on-surface">关于</div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-on-surface-variant">版本号</span>
        <span className="rounded-md bg-surface-container-high px-2 py-0.5 font-mono text-xs font-semibold text-on-surface">
          V{currentVersion || "---"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleCheckUpdate}
          disabled={checking}
          className="ui-interactive ui-focus-ring flex items-center gap-1.5 rounded-lg border border-border bg-surface-container-high px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={checking ? "检查中" : "检查更新"}
        >
          {checking ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>检查中...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>检查更新</span>
            </>
          )}
        </button>

        {error && (
          <div className="flex items-center gap-1 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
            <button
              onClick={handleCheckUpdate}
              className="ml-1 underline hover:no-underline"
            >
              重试
            </button>
          </div>
        )}

        {!checking && !error && !updateAvailable && (
          <div className="flex items-center gap-1 text-xs text-success">
            <Check className="h-3.5 w-3.5" />
            <span>已是最新版本</span>
          </div>
        )}
      </div>

      {updateAvailable && updateInfo && (
        <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-on-surface">
                  V{updateInfo.version}
                </span>
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-medium text-success">
                  新版本可用
                </span>
              </div>
              {updateInfo.releaseDate && (
                <div className="mt-1 text-xs text-on-surface-variant">
                  发布日期：{formatDate(updateInfo.releaseDate)}
                </div>
              )}
            </div>
            <button
              onClick={handleOpenDownload}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              <span>下载更新</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </button>
          </div>

          {updateInfo.releaseNotes && (
            <div className="mt-3 border-t border-border/50 pt-3">
              <div className="mb-1 text-xs font-medium text-on-surface-variant">
                更新说明
              </div>
              <div className="whitespace-pre-wrap text-xs text-on-surface-variant">
                {updateInfo.releaseNotes}
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="mt-3 text-xs text-on-surface-variant underline hover:no-underline"
          >
            稍后提醒
          </button>
        </div>
      )}
    </section>
  );
}