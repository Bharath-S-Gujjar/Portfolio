import { FormEvent, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { uploadCertificate } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import ScrollReveal from "@/components/ScrollReveal";

const UploadCertificate = () => {
  const [title, setTitle] = useState("");
  const [eventName, setEventName] = useState("");
  const [college, setCollege] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title || !eventName || !college || !location || !description || !file) {
      toast({ title: "All fields and a PDF file are required", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("event", eventName);
    formData.append("college", college);
    formData.append("location", location);
    formData.append("description", description);
    formData.append("certificate", file);

    setUploading(true);
    try {
      await uploadCertificate(formData);
      toast({ title: "Certificate uploaded successfully!" });
      setTitle("");
      setEventName("");
      setCollege("");
      setLocation("");
      setDescription("");
      setFile(null);
    } catch (error: unknown) {
      toast({ title: getErrorMessage(error) || "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="py-28 relative">
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal>
          <div className="mb-10">
            <h1 className="font-heading text-5xl font-bold gradient-text mb-4">Upload Certificate</h1>
            <p className="max-w-2xl text-muted-foreground">Upload a new certificate PDF and save metadata to the portfolio backend.</p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <form onSubmit={handleSubmit} className="grid gap-6 max-w-2xl">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Certificate title"
              className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none border border-border/50"
            />
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name"
              className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none border border-border/50"
            />
            <input
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="College or issuer"
              className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none border border-border/50"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none border border-border/50"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              rows={4}
              className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none border border-border/50 resize-none"
            />
            <label className="flex flex-col gap-2 rounded-2xl glass border border-border/50 p-4 cursor-pointer">
              <span className="text-sm text-foreground font-medium">Certificate PDF</span>
              <span className="text-xs text-muted-foreground">Only PDF files are accepted.</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <span className="text-sm text-primary">{file ? file.name : "Choose a file"}</span>
            </label>
            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-semibold transition hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Certificate"}
            </button>
          </form>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default UploadCertificate;
