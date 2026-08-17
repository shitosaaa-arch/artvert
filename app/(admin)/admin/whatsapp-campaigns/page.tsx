"use client";

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileSpreadsheet,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  UsersRound,
  XCircle,
} from "lucide-react";

type ImportResult = {
  ok: boolean;

  campaign?: {
    id: string;
    name: string;
    status: string;
    templateName: string;
    languageCode: string;
    sourceFileName: string | null;
    createdAt: string;
  };

  import?: {
    sheet: string;
    phoneColumn: string;
    nameColumn: string | null;
    rowsRead: number;
    validUnique: number;
    pending: number;
    blocked: number;
    invalid: number;
    duplicates: number;
  };

  error?: string;
  availableColumns?: string[];
};

type SendResult = {
  ok?: boolean;
  message?: string;
  error?: string;

  run?: {
    attempted?: number;
    sent?: number;
    failed?: number;
    blocked?: number;
  };

  campaign?: {
    id?: string;
    name?: string;
    status?: string;
    totalRecipients?: number;
    sentCount?: number;
    failedCount?: number;
    blockedCount?: number;
    pendingCount?: number;
    startedAt?: string | null;
    completedAt?: string | null;
  };
};


type CampaignHistoryItem = {
  id: string;
  name: string;
  templateName: string;
  languageCode: string;
  status: string;
  totalRecipients: number;
  pendingCount: number;
  sentCount: number;
  failedCount: number;
  blockedCount: number;
  sourceFileName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CampaignHistoryResponse = {
  ok?: boolean;
  error?: string;
  campaigns?: CampaignHistoryItem[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type CampaignRecipient = {
  id: string;
  phone: string;
  displayName: string | null;
  status: string;
  blockedReason: string | null;
  failureReason: string | null;
  metaMessageId: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type CampaignDetails = CampaignHistoryItem & {
  recipients: CampaignRecipient[];
};

type CampaignDetailsResponse = {
  ok?: boolean;
  error?: string;
  campaign?: CampaignDetails;
};

function formatNumber(value: number) {
  return value.toLocaleString("ar-EG");
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default function WhatsAppCampaignsPage() {
  const [campaignName, setCampaignName] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [
    importing,
    setImporting,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    importResult,
    setImportResult,
  ] = useState<ImportResult | null>(
    null,
  );

  const [
    sendResult,
    setSendResult,
  ] = useState<SendResult | null>(
    null,
  );

  const [error, setError] =
    useState("");

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyLoaded,
    setHistoryLoaded,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  const [
    history,
    setHistory,
  ] = useState<CampaignHistoryItem[]>([]);

  const [
    historyPagination,
    setHistoryPagination,
  ] = useState<
    CampaignHistoryResponse["pagination"]
  >(undefined);

  const [
    selectedHistoryCampaign,
    setSelectedHistoryCampaign,
  ] = useState<CampaignHistoryItem | null>(
    null,
  );

  const [
    campaignDetailsLoading,
    setCampaignDetailsLoading,
  ] = useState(false);

  const [
    campaignDetailsError,
    setCampaignDetailsError,
  ] = useState("");

  const [
    campaignDetails,
    setCampaignDetails,
  ] = useState<CampaignDetails | null>(
    null,
  );

  const campaign =
    importResult?.campaign ?? null;

  const importStats =
    importResult?.import ?? null;

  const canSend = useMemo(() => {
    const pendingAfterSend =
      sendResult?.campaign?.pendingCount;

    const finalStatus =
      sendResult?.campaign?.status;

    if (
      finalStatus === "COMPLETED" ||
      finalStatus === "CANCELLED"
    ) {
      return false;
    }

    const pending =
      typeof pendingAfterSend === "number"
        ? pendingAfterSend
        : importStats?.pending ?? 0;

    return Boolean(
      campaign?.id &&
        pending > 0 &&
        !sending,
    );
  }, [
    campaign,
    importStats,
    sendResult,
    sending,
  ]);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selected =
      event.target.files?.[0] ??
      null;

    setFile(selected);
    setImportResult(null);
    setSendResult(null);
    setError("");
  }

  async function handleImport(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!file) {
      setError(
        "اختار ملف Excel الأول.",
      );
      return;
    }

    setImporting(true);
    setError("");
    setImportResult(null);
    setSendResult(null);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      if (campaignName.trim()) {
        formData.append(
          "name",
          campaignName.trim(),
        );
      }

      const response = await fetch(
        "/api/admin/whatsapp/campaigns/import",
        {
          method: "POST",
          body: formData,
        },
      );

      const data =
        (await response.json()) as ImportResult;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "فشل استيراد ملف العملاء.",
        );
      }

      setImportResult(data);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "حدث خطأ أثناء استيراد الملف.",
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleSendAll() {
    if (!campaign?.id) {
      return;
    }

    const confirmed =
      window.confirm(
        `سيتم بدء إرسال قالب واتساب لكل العملاء المؤهلين في هذه الحملة.\n\nعدد العملاء الجاهزين للإرسال: ${
          importStats?.pending ?? 0
        }\n\nهل تريد بدء الإرسال؟`,
      );

    if (!confirmed) {
      return;
    }

    setSending(true);
    setError("");
    setSendResult(null);

    try {
      const response = await fetch(
        `/api/admin/whatsapp/campaigns/${campaign.id}/send`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
        },
      );

      const data =
        (await response.json()) as SendResult;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "تعذر بدء إرسال الحملة.",
        );
      }

      setSendResult(data);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "حدث خطأ أثناء إرسال الحملة.",
      );
    } finally {
      setSending(false);
    }
  }

  async function loadCampaignHistory(
    page = 1,
  ) {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(
        `/api/admin/whatsapp/campaigns?page=${page}&pageSize=20`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as CampaignHistoryResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "تعذر تحميل سجل الحملات.",
        );
      }

      setHistory(data.campaigns ?? []);
      setHistoryPagination(
        data.pagination,
      );
      setHistoryLoaded(true);
    } catch (historyLoadError) {
      setHistoryError(
        historyLoadError instanceof Error
          ? historyLoadError.message
          : "حدث خطأ أثناء تحميل سجل الحملات.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadCampaignDetails(
    item: CampaignHistoryItem,
  ) {
    setSelectedHistoryCampaign(item);
    setCampaignDetails(null);
    setCampaignDetailsError("");
    setCampaignDetailsLoading(true);

    try {
      const response = await fetch(
        `/api/admin/whatsapp/campaigns/${item.id}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as CampaignDetailsResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.campaign
      ) {
        throw new Error(
          data.error ||
            "تعذر تحميل تفاصيل الحملة.",
        );
      }

      setCampaignDetails(
        data.campaign,
      );
    } catch (detailsError) {
      setCampaignDetailsError(
        detailsError instanceof Error
          ? detailsError.message
          : "حدث خطأ أثناء تحميل تفاصيل الحملة.",
      );
    } finally {
      setCampaignDetailsLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="flex items-center gap-2 text-sm font-black text-lime-300">
              <MessageCircle
                aria-hidden="true"
                size={18}
              />

              WhatsApp Campaigns
            </span>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              حملات واتساب
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-white/55">
              ارفع ملف العملاء، والنظام
              ينظف الأرقام ويحذف
              المكرر ويستبعد تلقائيًا
              أي عميل طلب إيقاف
              الرسائل، ثم تبدأ الحملة
              بضغطة واحدة.
            </p>
          </div>

          <div className="rounded-2xl border border-lime-300/20 bg-lime-300/[.06] px-5 py-4">
            <span className="flex items-center gap-2 text-sm font-bold text-lime-200">
              <ShieldCheck
                aria-hidden="true"
                size={18}
              />

              حماية Opt-out مفعلة
            </span>
          </div>
        </header>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <article className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
                <Upload
                  aria-hidden="true"
                  size={23}
                />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  إنشاء حملة جديدة
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  يدعم ملفات XLSX وXLS
                  وCSV.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleImport}
              className="mt-7 grid gap-5"
            >
              <label>
                <span className="mb-2 block text-sm font-bold text-white/60">
                  اسم الحملة
                </span>

                <input
                  value={campaignName}
                  onChange={(event) =>
                    setCampaignName(
                      event.target.value,
                    )
                  }
                  maxLength={200}
                  placeholder="مثال: متابعة عملاء أغسطس"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-white/60">
                  ملف العملاء
                </span>

                <div className="relative rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-6 transition hover:border-lime-300/30">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={
                      handleFileChange
                    }
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />

                  <div className="pointer-events-none text-center">
                    <FileSpreadsheet
                      aria-hidden="true"
                      size={36}
                      className="mx-auto text-lime-300"
                    />

                    <strong className="mt-3 block">
                      {file
                        ? file.name
                        : "اضغط لاختيار ملف Excel"}
                    </strong>

                    <span className="mt-2 block text-xs text-white/35">
                      {file
                        ? formatFileSize(
                            file.size,
                          )
                        : "الحد الأقصى 10 MB"}
                    </span>
                  </div>
                </div>
              </label>

              <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm leading-7 text-white/50">
                يفضل أن يحتوي الملف
                على عمود باسم{" "}
                <strong className="text-white">
                  رقم الهاتف
                </strong>{" "}
                أو{" "}
                <strong className="text-white">
                  phone
                </strong>
                . ويمكن إضافة عمود اسم
                العميل اختياريًا.
              </div>

              <button
                type="submit"
                disabled={
                  importing || !file
                }
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      size={19}
                      className="animate-spin"
                    />

                    جاري تحليل الملف...
                  </>
                ) : (
                  <>
                    <Upload
                      aria-hidden="true"
                      size={19}
                    />

                    رفع وتحليل العملاء
                  </>
                )}
              </button>
            </form>
          </article>

          <aside className="rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
            <h2 className="text-xl font-black">
              القالب المستخدم
            </h2>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-5">
              <span className="text-xs text-white/40">
                Template
              </span>

              <strong
                className="mt-2 block text-lime-300"
                dir="ltr"
              >
                artvert_customer_followup
              </strong>

              <div className="mt-4 border-t border-white/10 pt-4">
                <span className="text-xs text-white/40">
                  اللغة
                </span>

                <strong className="mt-2 block">
                  العربية - مصر
                </strong>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/[.05] p-4 text-sm leading-7 text-amber-100/70">
              <AlertTriangle
                aria-hidden="true"
                size={18}
                className="mt-1 shrink-0"
              />

              الأرقام التي ضغطت
              «إيقاف الرسائل» يتم
              استبعادها من الحملة
              تلقائيًا.
            </div>
          </aside>
        </section>

        {error ? (
          <section className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[.07] p-4 text-red-100">
            <XCircle
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <strong className="block">
                حدث خطأ
              </strong>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          </section>
        ) : null}

        {campaign && importStats ? (
          <section className="mt-8 rounded-3xl border border-lime-300/20 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="flex items-center gap-2 text-sm font-black text-lime-300">
                  <CheckCircle2
                    aria-hidden="true"
                    size={18}
                  />

                  تم تجهيز الحملة
                </span>

                <h2 className="mt-2 text-2xl font-black">
                  {campaign.name}
                </h2>

                <p
                  className="mt-2 text-xs text-white/35"
                  dir="ltr"
                >
                  Campaign ID:{" "}
                  {campaign.id}
                </p>
              </div>

              <span className="w-fit rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-200">
                {campaign.status}
              </span>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard
                label="صفوف الملف"
                value={
                  importStats.rowsRead
                }
                icon={
                  FileSpreadsheet
                }
              />

              <StatCard
                label="أرقام صالحة"
                value={
                  importStats.validUnique
                }
                icon={UsersRound}
              />

              <StatCard
                label="جاهز للإرسال"
                value={
                  importStats.pending
                }
                icon={Send}
                highlight
              />

              <StatCard
                label="تم استبعادها"
                value={
                  importStats.blocked
                }
                icon={ShieldCheck}
              />

              <StatCard
                label="أرقام غير صالحة"
                value={
                  importStats.invalid
                }
                icon={XCircle}
              />

              <StatCard
                label="مكرر"
                value={
                  importStats.duplicates
                }
                icon={UsersRound}
              />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <InfoBox
                title="عمود الهاتف"
                value={
                  importStats.phoneColumn
                }
              />

              <InfoBox
                title="عمود الاسم"
                value={
                  importStats.nameColumn ||
                  "غير موجود"
                }
              />

              <InfoBox
                title="صفحة Excel"
                value={
                  importStats.sheet
                }
              />
            </div>

            <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <strong className="text-lg">
                  إرسال الحملة
                </strong>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  عند الضغط على الزر
                  سيتم إرسال القالب إلى{" "}
                  <strong className="text-lime-300">
                    {formatNumber(
                      importStats.pending,
                    )}
                  </strong>{" "}
                  عميل مؤهل.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSendAll}
                disabled={!canSend}
                className="flex min-h-12 min-w-[220px] items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 font-black text-[#071109] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      size={19}
                      className="animate-spin"
                    />

                    جاري بدء الحملة...
                  </>
                ) : (
                  <>
                    <Send
                      aria-hidden="true"
                      size={19}
                    />

                    إرسال للجميع
                  </>
                )}
              </button>
            </div>
          </section>
        ) : null}

        {sendResult?.ok ? (
          <section className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/[.07] p-5 text-emerald-100 shadow-2xl sm:p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2
                aria-hidden="true"
                size={22}
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0">
                <strong className="block text-lg">
                  نتيجة الحملة
                </strong>

                <p className="mt-1 text-sm leading-7">
                  {sendResult.message ||
                    "تمت معالجة رسائل واتساب للحملة."}
                </p>
              </div>
            </div>

            {sendResult.campaign ? (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <ResultCard
                    label="تم الإرسال"
                    value={
                      sendResult.campaign.sentCount ?? 0
                    }
                  />

                  <ResultCard
                    label="فشل"
                    value={
                      sendResult.campaign.failedCount ?? 0
                    }
                  />

                  <ResultCard
                    label="مستبعد"
                    value={
                      sendResult.campaign.blockedCount ?? 0
                    }
                  />

                  <ResultCard
                    label="متبقي"
                    value={
                      sendResult.campaign.pendingCount ?? 0
                    }
                  />

                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <span className="block text-xs text-white/45">
                      حالة الحملة
                    </span>

                    <strong className="mt-2 block break-words text-sm text-white">
                      {sendResult.campaign.status || "غير معروفة"}
                    </strong>
                  </div>
                </div>

                {sendResult.run ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-7 text-white/55">
                    تمت معالجة{" "}
                    <strong className="text-white">
                      {formatNumber(
                        sendResult.run.attempted ?? 0,
                      )}
                    </strong>{" "}
                    رقم في هذه المحاولة، نجح منها{" "}
                    <strong className="text-emerald-200">
                      {formatNumber(
                        sendResult.run.sent ?? 0,
                      )}
                    </strong>
                    ، وفشل{" "}
                    <strong className="text-red-200">
                      {formatNumber(
                        sendResult.run.failed ?? 0,
                      )}
                    </strong>
                    ، وتم استبعاد{" "}
                    <strong className="text-amber-200">
                      {formatNumber(
                        sendResult.run.blocked ?? 0,
                      )}
                    </strong>
                    .
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        ) : null}

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="flex items-center gap-2 text-sm font-black text-lime-300">
                <Clock3 aria-hidden="true" size={18} />
                Campaign History
              </span>

              <h2 className="mt-2 text-2xl font-black">
                سجل الحملات السابقة
              </h2>

              <p className="mt-2 text-sm leading-7 text-white/45">
                راجع الحملات السابقة ونتائج الإرسال وحالة كل حملة من مكان واحد.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadCampaignHistory(
                  historyPagination?.page ?? 1,
                )
              }
              disabled={historyLoading}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-black text-white transition hover:bg-white/[.07] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {historyLoading ? (
                <Loader2 aria-hidden="true" size={17} className="animate-spin" />
              ) : (
                <RefreshCw aria-hidden="true" size={17} />
              )}

              {historyLoaded
                ? "تحديث السجل"
                : "تحميل السجل"}
            </button>
          </div>

          {historyError ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[.07] p-4 text-red-100">
              <XCircle aria-hidden="true" size={19} className="mt-0.5 shrink-0" />
              <span className="text-sm leading-7">
                {historyError}
              </span>
            </div>
          ) : null}

          {historyLoaded && history.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-6 text-center text-sm text-white/45">
              لا توجد حملات سابقة حتى الآن.
            </div>
          ) : null}

          {history.length > 0 ? (
            <>
              <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
                <table className="min-w-[1100px] w-full text-sm">
                  <thead className="bg-white/[.04] text-white/50">
                    <tr>
                      <th className="px-4 py-3 text-right font-bold">الحملة</th>
                      <th className="px-4 py-3 text-right font-bold">التاريخ</th>
                      <th className="px-4 py-3 text-right font-bold">الحالة</th>
                      <th className="px-4 py-3 text-right font-bold">الإجمالي</th>
                      <th className="px-4 py-3 text-right font-bold">تم الإرسال</th>
                      <th className="px-4 py-3 text-right font-bold">فشل</th>
                      <th className="px-4 py-3 text-right font-bold">مستبعد</th>
                      <th className="px-4 py-3 text-right font-bold">متبقي</th>
                      <th className="px-4 py-3 text-right font-bold">التفاصيل</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/10 text-white/75"
                      >
                        <td className="px-4 py-4">
                          <strong className="block text-white">
                            {item.name}
                          </strong>
                          <span
                            className="mt-1 block max-w-[260px] truncate text-xs text-white/30"
                            dir="ltr"
                          >
                            {item.id}
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </td>

                        <td className="px-4 py-4">
                          <CampaignStatusBadge status={item.status} />
                        </td>

                        <td className="px-4 py-4 font-black text-white">
                          {formatNumber(item.totalRecipients)}
                        </td>

                        <td className="px-4 py-4 font-black text-emerald-200">
                          {formatNumber(item.sentCount)}
                        </td>

                        <td className="px-4 py-4 font-black text-red-200">
                          {formatNumber(item.failedCount)}
                        </td>

                        <td className="px-4 py-4 font-black text-amber-200">
                          {formatNumber(item.blockedCount)}
                        </td>

                        <td className="px-4 py-4 font-black text-white">
                          {formatNumber(item.pendingCount)}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              loadCampaignDetails(item)
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-lime-300/20 bg-lime-300/[.06] px-3 py-2 text-xs font-black text-lime-200 transition hover:bg-lime-300/[.1]"
                          >
                            <Eye aria-hidden="true" size={15} />
                            عرض التفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {historyPagination &&
              historyPagination.totalPages > 1 ? (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-white/35">
                    صفحة {formatNumber(historyPagination.page)} من{" "}
                    {formatNumber(historyPagination.totalPages)} — إجمالي{" "}
                    {formatNumber(historyPagination.total)} حملة
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={
                        historyLoading ||
                        historyPagination.page <= 1
                      }
                      onClick={() =>
                        loadCampaignHistory(
                          historyPagination.page - 1,
                        )
                      }
                      className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-bold text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      السابق
                    </button>

                    <button
                      type="button"
                      disabled={
                        historyLoading ||
                        historyPagination.page >=
                          historyPagination.totalPages
                      }
                      onClick={() =>
                        loadCampaignHistory(
                          historyPagination.page + 1,
                        )
                      }
                      className="rounded-xl border border-white/10 bg-white/[.04] px-4 py-2 text-sm font-bold text-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {selectedHistoryCampaign ? (
            <div className="mt-6 rounded-3xl border border-lime-300/15 bg-lime-300/[.04] p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span className="text-xs font-black text-lime-300">
                    تفاصيل الحملة
                  </span>

                  <h3 className="mt-2 text-xl font-black text-white">
                    {campaignDetails?.name ??
                      selectedHistoryCampaign.name}
                  </h3>

                  <p
                    className="mt-2 text-xs text-white/30"
                    dir="ltr"
                  >
                    Campaign ID:{" "}
                    {selectedHistoryCampaign.id}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedHistoryCampaign(
                      null,
                    );
                    setCampaignDetails(
                      null,
                    );
                    setCampaignDetailsError(
                      "",
                    );
                  }}
                  className="w-fit rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-black text-white/60 transition hover:bg-white/[.07]"
                >
                  إغلاق
                </button>
              </div>

              {campaignDetailsLoading ? (
                <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/10 p-8 text-white/55">
                  <Loader2
                    aria-hidden="true"
                    size={20}
                    className="animate-spin text-lime-300"
                  />

                  جاري تحميل عملاء الحملة...
                </div>
              ) : null}

              {campaignDetailsError ? (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[.07] p-4 text-red-100">
                  <XCircle
                    aria-hidden="true"
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <strong className="block">
                      تعذر تحميل التفاصيل
                    </strong>

                    <p className="mt-1 text-sm leading-7">
                      {campaignDetailsError}
                    </p>
                  </div>
                </div>
              ) : null}

              {campaignDetails ? (
                <>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoBox
                      title="الحالة"
                      value={
                        campaignDetails.status
                      }
                    />

                    <InfoBox
                      title="تاريخ الإنشاء"
                      value={formatDate(
                        campaignDetails.createdAt,
                      )}
                    />

                    <InfoBox
                      title="بدأت"
                      value={formatDate(
                        campaignDetails.startedAt,
                      )}
                    />

                    <InfoBox
                      title="اكتملت"
                      value={formatDate(
                        campaignDetails.completedAt,
                      )}
                    />

                    <InfoBox
                      title="القالب"
                      value={
                        campaignDetails.templateName
                      }
                    />

                    <InfoBox
                      title="اللغة"
                      value={
                        campaignDetails.languageCode
                      }
                    />

                    <InfoBox
                      title="الملف المصدر"
                      value={
                        campaignDetails.sourceFileName ||
                        "غير مسجل"
                      }
                    />

                    <InfoBox
                      title="إجمالي العملاء"
                      value={formatNumber(
                        campaignDetails.totalRecipients,
                      )}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <ResultCard
                      label="تم الإرسال"
                      value={
                        campaignDetails.sentCount
                      }
                    />

                    <ResultCard
                      label="فشل"
                      value={
                        campaignDetails.failedCount
                      }
                    />

                    <ResultCard
                      label="مستبعد"
                      value={
                        campaignDetails.blockedCount
                      }
                    />

                    <ResultCard
                      label="متبقي"
                      value={
                        campaignDetails.pendingCount
                      }
                    />
                  </div>

                  <div className="mt-7">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h4 className="text-lg font-black text-white">
                          عملاء الحملة
                        </h4>

                        <p className="mt-1 text-sm text-white/40">
                          حالة كل رقم ونتيجة محاولة الإرسال.
                        </p>
                      </div>

                      <span className="w-fit rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-black text-white/55">
                        {formatNumber(
                          campaignDetails.recipients
                            .length,
                        )}{" "}
                        عميل
                      </span>
                    </div>

                    {campaignDetails.recipients
                      .length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-6 text-center text-sm text-white/40">
                        لا يوجد عملاء مسجلون في هذه الحملة.
                      </div>
                    ) : (
                      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
                        <table className="w-full min-w-[1200px] text-sm">
                          <thead className="bg-black/20 text-white/45">
                            <tr>
                              <th className="px-4 py-3 text-right font-bold">
                                الاسم
                              </th>
                              <th className="px-4 py-3 text-right font-bold">
                                رقم واتساب
                              </th>
                              <th className="px-4 py-3 text-right font-bold">
                                الحالة
                              </th>
                              <th className="px-4 py-3 text-right font-bold">
                                المحاولات
                              </th>
                              <th className="px-4 py-3 text-right font-bold">
                                وقت الإرسال
                              </th>
                              <th className="px-4 py-3 text-right font-bold">
                                سبب الاستبعاد / الفشل
                              </th>
                              <th className="px-4 py-3 text-right font-bold">
                                Meta Message ID
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {campaignDetails.recipients.map(
                              (recipient) => {
                                const reason =
                                  recipient.blockedReason ||
                                  recipient.failureReason ||
                                  "—";

                                return (
                                  <tr
                                    key={
                                      recipient.id
                                    }
                                    className="border-t border-white/10 text-white/70"
                                  >
                                    <td className="px-4 py-4">
                                      <strong className="text-white">
                                        {recipient.displayName ||
                                          "بدون اسم"}
                                      </strong>
                                    </td>

                                    <td
                                      className="px-4 py-4 font-bold text-white"
                                      dir="ltr"
                                    >
                                      {recipient.phone}
                                    </td>

                                    <td className="px-4 py-4">
                                      <RecipientStatusBadge
                                        status={
                                          recipient.status
                                        }
                                      />
                                    </td>

                                    <td className="px-4 py-4 font-black text-white">
                                      {formatNumber(
                                        recipient.attemptCount,
                                      )}
                                    </td>

                                    <td className="px-4 py-4 whitespace-nowrap">
                                      {formatDate(
                                        recipient.sentAt ||
                                          recipient.lastAttemptAt,
                                      )}
                                    </td>

                                    <td className="max-w-[360px] px-4 py-4">
                                      <span
                                        className={
                                          reason === "—"
                                            ? "text-white/30"
                                            : "break-words text-amber-100/75"
                                        }
                                      >
                                        {reason}
                                      </span>
                                    </td>

                                    <td
                                      className="max-w-[300px] px-4 py-4"
                                      dir="ltr"
                                    >
                                      <span className="block truncate text-xs text-white/30">
                                        {recipient.metaMessageId ||
                                          "—"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: typeof UsersRound;
  highlight?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-lime-300/25 bg-lime-300/[.07]"
          : "border-white/10 bg-white/[.025]"
      }`}
    >
      <Icon
        aria-hidden="true"
        size={19}
        className={
          highlight
            ? "text-lime-300"
            : "text-white/45"
        }
      />

      <strong className="mt-4 block text-2xl font-black">
        {formatNumber(value)}
      </strong>

      <span className="mt-1 block text-xs text-white/40">
        {label}
      </span>
    </article>
  );
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <span className="block text-xs text-white/45">
        {label}
      </span>

      <strong className="mt-2 block text-2xl font-black text-white">
        {formatNumber(value)}
      </strong>
    </div>
  );
}

function CampaignStatusBadge({
  status,
}: {
  status: string;
}) {
  const labelMap: Record<string, string> = {
    DRAFT: "مسودة",
    READY: "جاهزة",
    SENDING: "جاري الإرسال",
    COMPLETED: "مكتملة",
    PARTIALLY_COMPLETED: "مكتملة جزئيًا",
    FAILED: "فشلت",
    CANCELLED: "ملغاة",
  };

  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-black text-white/70">
      {labelMap[status] ?? status}
    </span>
  );
}

function RecipientStatusBadge({
  status,
}: {
  status: string;
}) {
  const labelMap: Record<string, string> = {
    PENDING: "في الانتظار",
    SENT: "تم الإرسال",
    FAILED: "فشل",
    BLOCKED: "مستبعد",
  };

  const classMap: Record<string, string> = {
    PENDING:
      "border-sky-300/20 bg-sky-300/[.07] text-sky-100",
    SENT:
      "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-100",
    FAILED:
      "border-red-300/20 bg-red-300/[.07] text-red-100",
    BLOCKED:
      "border-amber-300/20 bg-amber-300/[.07] text-amber-100",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
        classMap[status] ??
        "border-white/10 bg-white/[.04] text-white/70"
      }`}
    >
      {labelMap[status] ?? status}
    </span>
  );
}

function InfoBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
      <span className="block text-xs text-white/40">
        {title}
      </span>

      <strong className="mt-2 block break-words text-sm">
        {value}
      </strong>
    </div>
  );
}