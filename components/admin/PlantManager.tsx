"use client";

import Link from "next/link";
import DeletePlantButton from "@/components/admin/DeletePlantButton";
import { useRouter } from "next/navigation";
import {
  Archive,
  Bug,
  ChevronLeft,
  ChevronRight,
  FilePenLine,
  FlaskConical,
  ImageIcon,
  Leaf,
  Plus,
  Search,
  Sprout,
  Stethoscope,
  TreePine,
  UsersRound,
} from "lucide-react";

type PlantItem = {
  id: string;
  slug: string;
  name: string;
  publicationState:
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED";
  category:
    | "CROP"
    | "HOME_PLANT"
    | "ORNAMENTAL";
  scientificName: string | null;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  aliases: Array<{
    id: string;
    value: string;
  }>;
  diseaseCount: number;
  pestCount: number;
  deficiencyCount: number;
  imageCount: number;
  savedCount: number;
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  totalPlants: number;
  cropCount: number;
  homePlantCount: number;
  ornamentalCount: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
};

type Props = {
  search: string;
  category: string;
  state: string;
  currentPage: number;
  totalPages: number;
  filteredCount: number;
  stats: Stats;
  plants: PlantItem[];
};

const categoryLabels: Record<string, string> = {
  CROP: "محصول زراعي",
  HOME_PLANT: "نبات منزلي",
  ORNAMENTAL: "نبات زينة",
};

const stateLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));
}

function getStateClass(state: string) {
  switch (state) {
    case "PUBLISHED":
      return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
    case "ARCHIVED":
      return "border-white/10 bg-white/[.04] text-white/45";
    default:
      return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }
}

function buildPageUrl({
  search,
  category,
  state,
  page,
}: {
  search: string;
  category: string;
  state: string;
  page: number;
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (category !== "ALL") {
    params.set("category", category);
  }

  if (state !== "ALL") {
    params.set("state", state);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/plants?${query}`
    : "/admin/plants";
}

export default function PlantManager({
  search,
  category,
  state,
  currentPage,
  totalPages,
  filteredCount,
  stats,
  plants,
}: Props) {
  const router = useRouter();

  const metricCards = [
    {
      label: "إجمالي النباتات",
      value: stats.totalPlants,
      icon: Leaf,
    },
    {
      label: "المحاصيل",
      value: stats.cropCount,
      icon: Sprout,
    },
    {
      label: "النباتات المنزلية",
      value: stats.homePlantCount,
      icon: TreePine,
    },
    {
      label: "نباتات الزينة",
      value: stats.ornamentalCount,
      icon: ImageIcon,
    },
  ];

  return (
    <main
      className="min-h-screen flex-1 bg-[#061008] px-4 py-8 text-white sm:px-6 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-sm font-black text-lime-300">
              Doctor Knowledge Base
            </span>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              إدارة النباتات والمحاصيل
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-white/55">
              إدارة الكيانات النباتية وربطها بالأمراض والآفات
              ونواقص العناصر داخل قاعدة المعرفة.
            </p>
          </div>

          <Link
            href="/admin/plants/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-lime-300 px-5 text-sm font-black text-[#071109] transition hover:bg-lime-200"
          >
            <Plus
              aria-hidden="true"
              size={18}
            />
            إضافة نبات
          </Link>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className="rounded-2xl border border-white/10 bg-[#0b1a0e] p-5 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm text-white/45">
                      {metric.label}
                    </span>

                    <strong className="mt-3 block text-3xl font-black">
                      {metric.value.toLocaleString("ar-EG")}
                    </strong>
                  </div>

                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                    <Icon
                      aria-hidden="true"
                      size={22}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "منشور",
              value: stats.publishedCount,
              className:
                "border-emerald-400/20 bg-emerald-400/[.07] text-emerald-200",
            },
            {
              label: "مسودة",
              value: stats.draftCount,
              className:
                "border-amber-400/20 bg-amber-400/[.07] text-amber-200",
            },
            {
              label: "مؤرشف",
              value: stats.archivedCount,
              className:
                "border-white/10 bg-white/[.03] text-white/55",
            },
          ].map((item) => (
            <article
              key={item.label}
              className={`rounded-2xl border p-4 ${item.className}`}
            >
              <span className="text-sm">
                {item.label}
              </span>
              <strong className="mt-2 block text-2xl font-black">
                {item.value.toLocaleString("ar-EG")}
              </strong>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#0b1a0e] p-5 shadow-2xl sm:p-6">
          <form
            action="/admin/plants"
            method="GET"
            className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_220px_220px_auto]"
          >
            <label className="relative block">
              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                name="search"
                defaultValue={search}
                placeholder="الاسم، الاسم العلمي، الاسم البديل أو الرابط"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/[.04] pr-11 pl-4 outline-none transition placeholder:text-white/25 focus:border-lime-300 focus:ring-4 focus:ring-lime-300/10"
              />
            </label>

            <select
              name="category"
              defaultValue={category}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              <option value="ALL">
                كل التصنيفات
              </option>
              <option value="CROP">
                المحاصيل
              </option>
              <option value="HOME_PLANT">
                النباتات المنزلية
              </option>
              <option value="ORNAMENTAL">
                نباتات الزينة
              </option>
            </select>

            <select
              name="state"
              defaultValue={state}
              className="h-12 rounded-xl border border-white/10 bg-[#0d2112] px-4 outline-none"
            >
              <option value="ALL">
                كل حالات النشر
              </option>
              <option value="PUBLISHED">
                منشور
              </option>
              <option value="DRAFT">
                مسودة
              </option>
              <option value="ARCHIVED">
                مؤرشف
              </option>
            </select>

            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 px-5 font-black text-[#071109]"
            >
              <Search
                aria-hidden="true"
                size={18}
              />
              بحث
            </button>
          </form>

          {(search ||
            category !== "ALL" ||
            state !== "ALL") && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-sm text-white/50">
                تم العثور على{" "}
                <strong className="text-lime-300">
                  {filteredCount.toLocaleString("ar-EG")}
                </strong>{" "}
                نبات
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push("/admin/plants")
                }
                className="text-sm font-bold text-white/60 transition hover:text-lime-300"
              >
                مسح البحث والفلاتر
              </button>
            </div>
          )}
        </section>

        <section className="mt-8 space-y-4">
          {plants.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-[#0b1a0e] px-6 py-16 text-center">
              <Leaf
                aria-hidden="true"
                size={34}
                className="mx-auto text-lime-300"
              />
              <h2 className="mt-5 text-2xl font-black">
                لا توجد نباتات
              </h2>
              <p className="mt-3 text-white/50">
                لا توجد نتائج مطابقة للبحث أو الفلاتر الحالية.
              </p>
            </div>
          ) : (
            plants.map((plant) => (
              <article
                key={plant.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1a0e] shadow-2xl"
              >
                <div className="grid gap-0 xl:grid-cols-[220px_minmax(0,1fr)_340px]">
                  <div className="border-b border-white/10 p-5 xl:border-l xl:border-b-0">
                    <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
                      {plant.imageUrl ? (
                        <img
                          src={plant.imageUrl}
                          alt={
                            plant.imageAlt ??
                            plant.name
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-lime-300/60">
                          <Leaf
                            aria-hidden="true"
                            size={42}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-b border-white/10 p-5 sm:p-6 xl:border-l xl:border-b-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-black">
                        {plant.name}
                      </h2>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${getStateClass(
                          plant.publicationState,
                        )}`}
                      >
                        {stateLabels[
                          plant.publicationState
                        ]}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-white/55">
                        {categoryLabels[
                          plant.category
                        ]}
                      </span>
                    </div>

                    {plant.scientificName ? (
                      <p
                        className="mt-2 text-sm italic text-white/45"
                        dir="ltr"
                      >
                        {plant.scientificName}
                      </p>
                    ) : null}

                    <p
                      className="mt-3 text-sm text-lime-300"
                      dir="ltr"
                    >
                      /{plant.slug}
                    </p>

                    {plant.description ? (
                      <p className="mt-4 line-clamp-3 leading-7 text-white/55">
                        {plant.description}
                      </p>
                    ) : null}

                    {plant.aliases.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {plant.aliases.map((alias) => (
                          <span
                            key={alias.id}
                            className="rounded-full bg-white/[.05] px-3 py-1 text-xs text-white/50"
                          >
                            {alias.value}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <p className="mt-5 text-xs text-white/35">
                      آخر تحديث:{" "}
                      {formatDate(plant.updatedAt)}
                    </p>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="grid grid-cols-2 gap-3">
                      <Counter
                        icon={Stethoscope}
                        label="الأمراض"
                        value={plant.diseaseCount}
                      />
                      <Counter
                        icon={Bug}
                        label="الآفات"
                        value={plant.pestCount}
                      />
                      <Counter
                        icon={FlaskConical}
                        label="النواقص"
                        value={plant.deficiencyCount}
                      />
                      <Counter
                        icon={ImageIcon}
                        label="الصور"
                        value={plant.imageCount}
                      />
                      <Counter
                        icon={UsersRound}
                        label="الحفظ"
                        value={plant.savedCount}
                      />
                    </div>

                    <div className="mt-5 grid gap-3">
                      <Link
                        href={`/admin/plants/${plant.id}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-black text-[#071109]"
                      >
                        فتح النبات
                        <ChevronLeft
                          aria-hidden="true"
                          size={17}
                        />
                      </Link>

                      <Link
                        href={`/admin/plants/${plant.id}/edit`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-400/[.08] px-4 text-sm font-black text-sky-200"
                      >
                        <FilePenLine
                          aria-hidden="true"
                          size={17}
                        />
                        تعديل
                      </Link>

                      <DeletePlantButton
                        plantId={plant.id}
                        plantName={plant.name}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        {totalPages > 1 ? (
          <nav className="mt-8 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b1a0e] p-4">
            <span className="text-sm text-white/50">
              الصفحة{" "}
              {currentPage.toLocaleString("ar-EG")} من{" "}
              {totalPages.toLocaleString("ar-EG")}
            </span>

            <div className="flex gap-3">
              {currentPage > 1 ? (
                <Link
                  href={buildPageUrl({
                    search,
                    category,
                    state,
                    page: currentPage - 1,
                  })}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm font-bold"
                >
                  <ChevronRight
                    aria-hidden="true"
                    size={16}
                  />
                  السابق
                </Link>
              ) : null}

              {currentPage < totalPages ? (
                <Link
                  href={buildPageUrl({
                    search,
                    category,
                    state,
                    page: currentPage + 1,
                  })}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-lime-300 px-4 text-sm font-black text-[#071109]"
                >
                  التالي
                  <ChevronLeft
                    aria-hidden="true"
                    size={16}
                  />
                </Link>
              ) : null}
            </div>
          </nav>
        ) : null}
      </div>
    </main>
  );
}

function Counter({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Leaf;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
      <Icon
        aria-hidden="true"
        size={16}
        className="text-lime-300"
      />
      <strong className="mt-2 block text-lg">
        {value.toLocaleString("ar-EG")}
      </strong>
      <span className="text-xs text-white/40">
        {label}
      </span>
    </div>
  );
}
