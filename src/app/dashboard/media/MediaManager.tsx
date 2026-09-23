"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import {
  FileText,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Trash2,
  Copy,
  Check,
  Download,
  Eye,
  Plus,
  FileDown,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { MediaItem } from "@/lib/media";
import type { ButtonDownloadsConfig } from "@/lib/button-downloads";
import {
  uploadMediaAction,
  deleteMediaAction,
  saveButtonDownloadsAction,
} from "./actions";
import { PageHeader, Spinner, Modal } from "@/components/dashboard/ui";

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function MediaManager({
  media: initialMedia,
  buttonDownloads: initialConfig,
}: {
  media: MediaItem[];
  buttonDownloads: ButtonDownloadsConfig;
}) {
  const [items, setItems] = useState<MediaItem[]>(initialMedia);
  const [config, setConfig] = useState<ButtonDownloadsConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<"library" | "buttons">("library");
  const [filter, setFilter] = useState<"all" | "image" | "pdf">("all");
  const [search, setSearch] = useState("");

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [altInput, setAltInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Config save feedback
  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState("");
  const [, startTransition] = useTransition();

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (filter !== "all" && item.category !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.originalName.toLowerCase().includes(q);
      const matchAlt = item.altText?.toLowerCase().includes(q);
      const matchUrl = item.url.toLowerCase().includes(q);
      return matchName || matchAlt || matchUrl;
    }
    return true;
  });

  const pdfList = items.filter((i) => i.category === "pdf" || i.url.endsWith(".pdf"));

  // Copy URL
  function copyUrl(item: MediaItem) {
    const fullUrl = item.url.startsWith("http")
      ? item.url
      : `${window.location.origin}${item.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Handle file select
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      if (!displayName) setDisplayName(f.name.replace(/\.[^/.]+$/, ""));
      if (!altInput) setAltInput(f.name.replace(/\.[^/.]+$/, ""));
    }
  }

  // Submit upload
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      if (uploadMode === "file") {
        if (!selectedFile) {
          setUploadError("Please select a file to upload.");
          setIsUploading(false);
          return;
        }
        formData.append("file", selectedFile);
      } else {
        if (!urlInput.trim()) {
          setUploadError("Please enter a valid file URL.");
          setIsUploading(false);
          return;
        }
        formData.append("url", urlInput.trim());
      }
      formData.append("name", displayName.trim());
      formData.append("altText", altInput.trim());

      const res = await uploadMediaAction(formData);
      if (res.ok) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUrlInput("");
        setDisplayName("");
        setAltInput("");
        // Reload full list or reload page
        window.location.reload();
      } else {
        setUploadError(res.error || "Upload failed.");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload error.");
    } finally {
      setIsUploading(false);
    }
  }

  // Delete media item
  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteMediaAction(deleteTarget.id);
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  // Save button configuration
  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setConfigSaving(true);
    setConfigSaved(false);
    setConfigError("");

    startTransition(async () => {
      const res = await saveButtonDownloadsAction(config);
      setConfigSaving(false);
      if (res.ok) {
        setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 3000);
      } else {
        setConfigError(res.error || "Failed to save configuration.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Media & Downloadable Buttons"
          description="Manage website images, upload PDF brochures and attach downloadable documents directly to site buttons."
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setUploadMode("file");
              setShowUploadModal(true);
            }}
            className="btn btn-dark inline-flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            <span>Add Image / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-navy-900/10">
        <button
          type="button"
          onClick={() => setActiveTab("library")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-display text-sm uppercase tracking-[0.16em] transition-colors ${
            activeTab === "library"
              ? "border-navy-900 text-navy-900 font-semibold"
              : "border-transparent text-stone hover:text-navy-900"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Images &amp; Files Library ({items.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("buttons")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 font-display text-sm uppercase tracking-[0.16em] transition-colors ${
            activeTab === "buttons"
              ? "border-navy-900 text-navy-900 font-semibold"
              : "border-transparent text-stone hover:text-navy-900"
          }`}
        >
          <FileDown className="h-4 w-4" />
          <span>Downloadable PDF Buttons</span>
        </button>
      </div>

      {/* TAB 1: Media Library */}
      {activeTab === "library" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col gap-4 bg-white p-4 border border-navy-900/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === "all"
                    ? "bg-navy-900 text-white"
                    : "bg-stone/10 text-navy-900 hover:bg-stone/20"
                }`}
              >
                All Files ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("image")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === "image"
                    ? "bg-navy-900 text-white"
                    : "bg-stone/10 text-navy-900 hover:bg-stone/20"
                }`}
              >
                Images ({items.filter((i) => i.category === "image").length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("pdf")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  filter === "pdf"
                    ? "bg-navy-900 text-white"
                    : "bg-stone/10 text-navy-900 hover:bg-stone/20"
                }`}
              >
                PDF Documents ({items.filter((i) => i.category === "pdf").length})
              </button>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, filename or URL..."
                className="field-input py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Media Grid */}
          {filteredItems.length === 0 ? (
            <div className="border border-dashed border-navy-900/20 bg-white p-12 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-stone/50 mb-3" />
              <p className="font-display text-lg text-navy-900">No media found</p>
              <p className="mt-1 text-xs text-stone">
                Upload images or PDF brochures to make them accessible across your website.
              </p>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="btn btn-dark mt-5 text-xs inline-flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Upload New File</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => {
                const isPdf = item.category === "pdf" || item.url.endsWith(".pdf");
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between border border-navy-900/10 bg-white overflow-hidden shadow-xs hover:border-navy-900/30 transition-all"
                  >
                    {/* Visual Area */}
                    <div className="relative h-44 w-full bg-navy-950/5 flex items-center justify-center overflow-hidden border-b border-navy-900/5">
                      {isPdf ? (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <div className="rounded-full bg-red-100 p-3 text-red-700 mb-2">
                            <FileText className="h-8 w-8" />
                          </div>
                          <span className="text-xs font-semibold text-navy-900 line-clamp-1">
                            {item.originalName}
                          </span>
                          <span className="text-[10px] text-stone mt-0.5">
                            {formatBytes(item.sizeBytes)} · PDF
                          </span>
                        </div>
                      ) : (
                        <div
                          className="relative h-full w-full cursor-pointer group-hover:scale-105 transition-transform duration-500"
                          onClick={() => setPreviewItem(item)}
                        >
                          <Image
                            src={item.url}
                            alt={item.altText || item.originalName}
                            fill
                            sizes="(max-width: 640px) 100vw, 320px"
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Category Badge */}
                      <span
                        className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white ${
                          isPdf ? "bg-red-700" : "bg-navy-900"
                        }`}
                      >
                        {isPdf ? "PDF" : "IMAGE"}
                      </span>

                      {/* Action overlays */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-950/60 p-1 backdrop-blur-xs">
                        {isPdf ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-white hover:text-teal-300 transition-colors"
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="p-1.5 text-white hover:text-teal-300 transition-colors"
                            title="View full resolution"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-white hover:text-red-400 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Area */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4
                          className="font-sans text-xs font-semibold text-navy-900 line-clamp-1"
                          title={item.originalName}
                        >
                          {item.originalName}
                        </h4>
                        <p
                          className="mt-1 font-mono text-[10px] text-stone line-clamp-1 select-all"
                          title={item.url}
                        >
                          {item.url}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-navy-900/5 flex items-center justify-between text-[11px]">
                        <span className="text-stone">
                          {formatBytes(item.sizeBytes)}
                        </span>
                        <div className="flex items-center gap-2">
                          {isPdf && (
                            <a
                              href={item.url}
                              download
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 hover:text-teal-900"
                              title="Download PDF"
                            >
                              <Download className="h-3 w-3" />
                              <span>Download</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => copyUrl(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy-900 hover:text-ocean-600"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Downloadable PDF Buttons Configuration */}
      {activeTab === "buttons" && (
        <form onSubmit={handleSaveConfig} className="space-y-8">
          <div className="border border-navy-900/10 bg-white p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow text-[0.65rem] text-stone">Website Buttons</p>
                <h2 className="font-display mt-2 text-2xl font-light text-navy-900">
                  Attach Downloadable PDF Files in Buttons
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-stone leading-relaxed">
                  Turn primary website buttons into downloadable PDF actions (or show secondary download buttons beside them). When clicked by visitors, the browser immediately saves the attached document.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs bg-teal-50 text-teal-900 px-3 py-2 border border-teal-200">
                <Sparkles className="h-4 w-4 text-teal-700" />
                <span>Instant client-side downloads via HTML5 download attribute</span>
              </div>
            </div>

            <div className="mt-8 space-y-8 divide-y divide-navy-900/10">
              {/* 1. Yacht Section Button */}
              <div className="pt-6 first:pt-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-lg text-navy-900">
                      1. Finch 65 Yacht Profile Section
                    </h3>
                    <p className="text-xs text-stone">
                      Appears next to the &quot;Charter Finch 65&quot; booking button in the yacht specifications section.
                    </p>
                  </div>
                  <label className="checkbox-row cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.yachtButton.enabled}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          yachtButton: {
                            ...config.yachtButton,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-sm font-semibold text-navy-900">
                      Enable Downloadable PDF Button
                    </span>
                  </label>
                </div>

                {config.yachtButton.enabled && (
                  <div className="mt-4 grid gap-4 bg-navy-950/5 p-5 sm:grid-cols-2">
                    <div>
                      <label className="field-label" htmlFor="yacht-btn-text">
                        Button Label
                      </label>
                      <input
                        id="yacht-btn-text"
                        type="text"
                        className="field-input"
                        value={config.yachtButton.buttonText}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            yachtButton: {
                              ...config.yachtButton,
                              buttonText: e.target.value,
                            },
                          })
                        }
                        placeholder="Download Yacht Specs & Rates (PDF)"
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="yacht-pdf-url">
                        Attached Downloadable PDF File
                      </label>
                      <select
                        id="yacht-pdf-url"
                        className="field-input"
                        value={config.yachtButton.pdfUrl}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            yachtButton: {
                              ...config.yachtButton,
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                      >
                        {pdfList.map((pdf) => (
                          <option key={pdf.id} value={pdf.url}>
                            {pdf.originalName} ({pdf.url})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label" htmlFor="yacht-pdf-label">
                        Document Tooltip / Description
                      </label>
                      <input
                        id="yacht-pdf-label"
                        type="text"
                        className="field-input"
                        value={config.yachtButton.pdfLabel}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            yachtButton: {
                              ...config.yachtButton,
                              pdfLabel: e.target.value,
                            },
                          })
                        }
                        placeholder="Finch 65 Specifications Brochure"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Food & Dining Menu Button */}
              <div className="pt-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-lg text-navy-900">
                      2. Food &amp; Dining Menu Section
                    </h3>
                    <p className="text-xs text-stone">
                      Appears alongside &quot;Explore Our Menu&quot; and inside the culinary modal dialog.
                    </p>
                  </div>
                  <label className="checkbox-row cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.menuButton.enabled}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          menuButton: {
                            ...config.menuButton,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-sm font-semibold text-navy-900">
                      Enable Downloadable PDF Button
                    </span>
                  </label>
                </div>

                {config.menuButton.enabled && (
                  <div className="mt-4 grid gap-4 bg-navy-950/5 p-5 sm:grid-cols-2">
                    <div>
                      <label className="field-label" htmlFor="menu-btn-text">
                        Button Label
                      </label>
                      <input
                        id="menu-btn-text"
                        type="text"
                        className="field-input"
                        value={config.menuButton.buttonText}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            menuButton: {
                              ...config.menuButton,
                              buttonText: e.target.value,
                            },
                          })
                        }
                        placeholder="Download Dining Menu (PDF)"
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="menu-pdf-url">
                        Attached Downloadable PDF File
                      </label>
                      <select
                        id="menu-pdf-url"
                        className="field-input"
                        value={config.menuButton.pdfUrl}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            menuButton: {
                              ...config.menuButton,
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                      >
                        {pdfList.map((pdf) => (
                          <option key={pdf.id} value={pdf.url}>
                            {pdf.originalName} ({pdf.url})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label" htmlFor="menu-pdf-label">
                        Document Tooltip / Description
                      </label>
                      <input
                        id="menu-pdf-label"
                        type="text"
                        className="field-input"
                        value={config.menuButton.pdfLabel}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            menuButton: {
                              ...config.menuButton,
                              pdfLabel: e.target.value,
                            },
                          })
                        }
                        placeholder="Salt Republic Dining & Beverage Menu"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Hero Rates Button */}
              <div className="pt-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-lg text-navy-900">
                      3. Hero Banner Rates Button
                    </h3>
                    <p className="text-xs text-stone">
                      Appears beside &quot;Book Your Trip&quot; in the hero intro banner at the top of the homepage.
                    </p>
                  </div>
                  <label className="checkbox-row cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.heroButton.enabled}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          heroButton: {
                            ...config.heroButton,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-sm font-semibold text-navy-900">
                      Enable Downloadable Rates Button
                    </span>
                  </label>
                </div>

                {config.heroButton.enabled && (
                  <div className="mt-4 grid gap-4 bg-navy-950/5 p-5 sm:grid-cols-2">
                    <div>
                      <label className="field-label" htmlFor="hero-btn-text">
                        Button Label
                      </label>
                      <input
                        id="hero-btn-text"
                        type="text"
                        className="field-input"
                        value={config.heroButton.buttonText}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            heroButton: {
                              ...config.heroButton,
                              buttonText: e.target.value,
                            },
                          })
                        }
                        placeholder="Download Rates (PDF)"
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="hero-pdf-url">
                        Attached Downloadable PDF File
                      </label>
                      <select
                        id="hero-pdf-url"
                        className="field-input"
                        value={config.heroButton.pdfUrl}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            heroButton: {
                              ...config.heroButton,
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                      >
                        {pdfList.map((pdf) => (
                          <option key={pdf.id} value={pdf.url}>
                            {pdf.originalName} ({pdf.url})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Header Navigation Button */}
              <div className="pt-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-display text-lg text-navy-900">
                      4. Navigation Header Brochure Button
                    </h3>
                    <p className="text-xs text-stone">
                      Appears in the desktop and mobile navigation header next to &quot;Book Now&quot;.
                    </p>
                  </div>
                  <label className="checkbox-row cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.headerButton.enabled}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          headerButton: {
                            ...config.headerButton,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                    <span className="text-sm font-semibold text-navy-900">
                      Enable Header Brochure Button
                    </span>
                  </label>
                </div>

                {config.headerButton.enabled && (
                  <div className="mt-4 grid gap-4 bg-navy-950/5 p-5 sm:grid-cols-2">
                    <div>
                      <label className="field-label" htmlFor="header-btn-text">
                        Button Label
                      </label>
                      <input
                        id="header-btn-text"
                        type="text"
                        className="field-input"
                        value={config.headerButton.buttonText}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            headerButton: {
                              ...config.headerButton,
                              buttonText: e.target.value,
                            },
                          })
                        }
                        placeholder="Brochure (PDF)"
                        required
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="header-pdf-url">
                        Attached Downloadable PDF File
                      </label>
                      <select
                        id="header-pdf-url"
                        className="field-input"
                        value={config.headerButton.pdfUrl}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            headerButton: {
                              ...config.headerButton,
                              pdfUrl: e.target.value,
                            },
                          })
                        }
                      >
                        {pdfList.map((pdf) => (
                          <option key={pdf.id} value={pdf.url}>
                            {pdf.originalName} ({pdf.url})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4 pt-6 border-t border-navy-900/10">
              <button
                type="submit"
                disabled={configSaving}
                className="btn btn-dark inline-flex items-center gap-2"
              >
                {configSaving ? <Spinner className="text-ivory" /> : null}
                <span>Save Button Settings</span>
              </button>
              {configSaved && (
                <span className="text-xs font-semibold text-emerald-700 animate-fade-in">
                  Button settings saved and live on website!
                </span>
              )}
              {configError && (
                <span className="text-xs text-red-700">{configError}</span>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <Modal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Add New Media or PDF File"
        >
          <div className="flex border-b border-navy-900/10 mb-5">
            <button
              type="button"
              onClick={() => setUploadMode("file")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                uploadMode === "file"
                  ? "border-navy-900 text-navy-900"
                  : "border-transparent text-stone hover:text-navy-900"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload from Computer</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode("url")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                uploadMode === "url"
                  ? "border-navy-900 text-navy-900"
                  : "border-transparent text-stone hover:text-navy-900"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Add by URL</span>
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {uploadMode === "file" ? (
              <div>
                <label className="field-label">Select Image or PDF</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-navy-900/20 bg-stone/5 p-6 text-center hover:bg-stone/10 transition-colors"
                >
                  <Upload className="mx-auto h-8 w-8 text-stone/60 mb-2" />
                  <p className="text-xs font-medium text-navy-900">
                    {selectedFile
                      ? selectedFile.name
                      : "Click to browse or drop an image (JPEG, PNG, WebP) or PDF file"}
                  </p>
                  <p className="text-[10px] text-stone mt-1">
                    {selectedFile
                      ? `${formatBytes(selectedFile.size)} · Ready to upload`
                      : "Supports images & downloadable PDF brochures"}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="field-label" htmlFor="media-url-input">
                  File URL
                </label>
                <input
                  id="media-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/brochure.pdf"
                  className="field-input"
                  required
                />
              </div>
            )}

            <div>
              <label className="field-label" htmlFor="media-display-name">
                Title / Display Name
              </label>
              <input
                id="media-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Finch 65 Sunset Deck or Luxury Brochure"
                className="field-input"
                required
              />
            </div>

            <div>
              <label className="field-label" htmlFor="media-alt-input">
                Alt Text / Description (Optional)
              </label>
              <input
                id="media-alt-input"
                type="text"
                value={altInput}
                onChange={(e) => setAltInput(e.target.value)}
                placeholder="Description of the image or document"
                className="field-input"
              />
            </div>

            {uploadError && (
              <p className="text-xs text-red-700 bg-red-50 p-2 border border-red-200">
                {uploadError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-navy-900/10">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="btn btn-dark inline-flex items-center gap-2"
              >
                {isUploading ? <Spinner className="text-ivory" /> : null}
                <span>Upload &amp; Save</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Remove Media Item"
        >
          <div className="space-y-4">
            <p className="text-sm text-stone leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-navy-900">{deleteTarget.originalName}</strong>?
            </p>
            <p className="text-xs text-stone/80">
              If this image or PDF is attached to buttons or displayed in gallery sections, it may no longer be accessible.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-navy-900/10">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="btn bg-red-700 text-white hover:bg-red-800"
              >
                {isDeleting ? <Spinner className="text-white" /> : null}
                <span>Yes, Remove File</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Preview Modal for Images */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/90 p-4 backdrop-blur-xs"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl w-full bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-navy-900/10">
              <div>
                <h3 className="font-display text-sm font-semibold text-navy-900">
                  {previewItem.originalName}
                </h3>
                <p className="text-[10px] text-stone font-mono">{previewItem.url}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1 text-stone hover:text-navy-900"
              >
                ✕
              </button>
            </div>
            <div className="relative h-[65vh] w-full bg-navy-950/5">
              <Image
                src={previewItem.url}
                alt={previewItem.altText || previewItem.originalName}
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-3 flex justify-between items-center text-xs">
              <span className="text-stone">
                {formatBytes(previewItem.sizeBytes)} · {previewItem.mimeType}
              </span>
              <button
                type="button"
                onClick={() => copyUrl(previewItem)}
                className="btn btn-dark text-xs inline-flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy URL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
