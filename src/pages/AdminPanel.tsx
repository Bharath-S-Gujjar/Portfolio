import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ScrollReveal from "@/components/ScrollReveal";
import { useToast } from "@/hooks/use-toast";
import {
  adminLogin,
  createProject,
  deleteCertificate,
  deleteProject,
  fetchCertificates,
  fetchProjects,
  seedAdminData,
  uploadCertificate,
  uploadCV,
  type Certificate,
  type Project,
} from "@/lib/api";

const AdminPanel = () => {
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem("adminToken"));
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"certificates" | "projects">("certificates");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [title, setTitle] = useState("");
  const [eventName, setEventName] = useState("");
  const [college, setCollege] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cvFile, setCVFile] = useState<File | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectRole, setProjectRole] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [projectHighlights, setProjectHighlights] = useState("");
  const [projectGradient, setProjectGradient] = useState("from-neon-purple/20 to-neon-blue/5");
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  const isAuthenticated = Boolean(adminToken);

  const parseErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null && "message" in error) {
      return String((error as { message?: unknown }).message || "An unexpected error occurred");
    }
    return "An unexpected error occurred";
  };

  const loadData = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [certs, projs] = await Promise.all([fetchCertificates(), fetchProjects()]);
      setCertificates(certs);
      setProjects(projs);
    } catch (error: unknown) {
      toast({ title: parseErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [adminToken, toast]);

  useEffect(() => {
    if (adminToken) {
      loadData();
    }
  }, [adminToken, loadData]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { token } = await adminLogin(password);
      setAdminToken(token);
      localStorage.setItem("adminToken", token);
      setPassword("");
      toast({ title: "Admin access granted" });
    } catch (error: unknown) {
      toast({ title: parseErrorMessage(error) || "Login failed", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
    setCertificates([]);
    setProjects([]);
    toast({ title: "Logged out" });
  };

  const handleSeedData = async () => {
    if (!adminToken) return;
    setSeeding(true);
    try {
      const { certificates: newCertificates, projects: newProjects } = await seedAdminData(adminToken);
      setCertificates(newCertificates);
      setProjects(newProjects);
      toast({ title: "Seeded sample certificates and projects" });
    } catch (error: unknown) {
      toast({ title: parseErrorMessage(error) || "Seed failed", variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const handleCertificateUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !eventName || !college || !location || !description || !file) {
      toast({ title: "All fields and a PDF file are required", variant: "destructive" });
      return;
    }
    if (!adminToken) return;
    const formData = new FormData();
    formData.append("title", title);
    formData.append("event", eventName);
    formData.append("college", college);
    formData.append("location", location);
    formData.append("description", description);
    formData.append("certificate", file);

    setUploadingCert(true);
    try {
      await uploadCertificate(formData, adminToken);
      toast({ title: "Certificate uploaded successfully" });
      setTitle("");
      setEventName("");
      setCollege("");
      setLocation("");
      setDescription("");
      setFile(null);
      await loadData();
    } catch (error: unknown) {
      toast({ title: parseErrorMessage(error) || "Upload failed", variant: "destructive" });
    } finally {
      setUploadingCert(false);
    }
  };

  const handleCVUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cvFile) {
      toast({ title: "Please choose a PDF file for CV", variant: "destructive" });
      return;
    }
    if (!adminToken) return;
    const formData = new FormData();
    formData.append("cv", cvFile);

    setUploadingCV(true);
    try {
      await uploadCV(formData, adminToken);
      toast({ title: "CV uploaded successfully" });
      setCVFile(null);
    } catch (error: unknown) {
      toast({ title: parseErrorMessage(error) || "CV upload failed", variant: "destructive" });
    } finally {
      setUploadingCV(false);
    }
  };

  const handleProjectCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectTitle || !projectRole || !projectDescription) {
      toast({ title: "Title, role, and description are required", variant: "destructive" });
      return;
    }
    if (!adminToken) return;
    setCreatingProject(true);
    try {
      await createProject(
        {
          title: projectTitle,
          role: projectRole,
          description: projectDescription,
          link: projectLink,
          highlights: projectHighlights
            .split(",")
            .map((highlight) => highlight.trim())
            .filter(Boolean),
          gradient: projectGradient,
        },
        adminToken
      );
      toast({ title: "Project created successfully" });
      setProjectTitle("");
      setProjectRole("");
      setProjectDescription("");
      setProjectLink("");
      setProjectHighlights("");
      await loadData();
    } catch (error: unknown) {
      toast({ title: parseErrorMessage(error) || "Project creation failed", variant: "destructive" });
    } finally {
      setCreatingProject(false);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!adminToken) return;
    if (!confirm("Delete this certificate permanently?")) return;
    try {
      await deleteCertificate(id, adminToken);
      toast({ title: "Certificate removed" });
      setCertificates((prev) => prev.filter((cert) => cert._id !== id));
    } catch (error: unknown) {
      toast({ title: parseErrorMessage(error) || "Delete failed", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!adminToken) return;
    if (!confirm("Delete this project permanently?")) return;
    try {
      await deleteProject(id, adminToken);
      toast({ title: "Project removed" });
      setProjects((prev) => prev.filter((project) => project._id !== id));
    } catch (error: unknown) {
      toast({ title: parseErrorMessage(error) || "Delete failed", variant: "destructive" });
    }
  };

  return (
    <section className="py-28 relative min-h-screen">
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal>
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-5xl font-bold gradient-text mb-3">Admin Dashboard</h1>
              <p className="max-w-2xl text-muted-foreground">
                Manage certificates and projects from a protected admin area.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/" className="rounded-xl glass px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/50 transition-all">
                View Public Site
              </Link>
              {isAuthenticated && (
                <button onClick={handleSeedData} disabled={seeding} className="rounded-xl glass px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/50 transition-all disabled:opacity-50">
                  {seeding ? "Restoring..." : "Restore Sample Content"}
                </button>
              )}
              {isAuthenticated && (
                <button onClick={handleLogout} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all">
                  Logout
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {!isAuthenticated ? (
          <ScrollReveal>
            <form onSubmit={handleLogin} className="glass rounded-3xl border border-border/50 p-8 max-w-xl mx-auto">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Admin Login</h2>
              <label className="block text-sm text-muted-foreground mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none"
                placeholder="Enter admin password"
              />
              <button type="submit" className="mt-6 w-full rounded-2xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition">
                Sign in as Admin
              </button>
            </form>
          </ScrollReveal>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setActiveTab("certificates")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === "certificates" ? "bg-primary text-primary-foreground" : "glass text-foreground"
                }`}
              >
                Certificates
              </button>
              <button
                onClick={() => setActiveTab("projects")}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  activeTab === "projects" ? "bg-primary text-primary-foreground" : "glass text-foreground"
                }`}
              >
                Projects
              </button>
            </div>

            {activeTab === "certificates" ? (
              <div className="grid lg:grid-cols-[1fr_380px] gap-8">
                <div className="space-y-6">
                  <ScrollReveal>
                    <div className="glass rounded-3xl border border-border/50 p-8">
                      <h2 className="font-heading text-2xl font-bold mb-4">Upload CV</h2>
                      <form onSubmit={handleCVUpload} className="space-y-4">
                        <label className="flex flex-col gap-2 rounded-2xl glass border border-border/50 p-4 cursor-pointer">
                          <span className="text-sm text-foreground font-medium">CV PDF</span>
                          <span className="text-xs text-muted-foreground">Only one CV is kept. Uploading replaces the current version.</span>
                          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setCVFile(e.target.files?.[0] ?? null)} />
                          <span className="text-sm text-primary">{cvFile ? cvFile.name : "Choose a PDF file"}</span>
                        </label>
                        <button type="submit" disabled={uploadingCV} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition disabled:opacity-50">
                          {uploadingCV ? "Uploading CV..." : "Upload CV"}
                        </button>
                      </form>
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p>
                          Current CV: <a href="/cv.pdf" target="_blank" rel="noreferrer" className="text-primary hover:underline">View</a> · <a href="/cv.pdf" download className="text-primary hover:underline">Download</a>
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal>
                    <div className="glass rounded-3xl border border-border/50 p-8">
                      <h2 className="font-heading text-2xl font-bold mb-4">Upload Certificate</h2>
                      <form onSubmit={handleCertificateUpload} className="space-y-4">
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Certificate title" className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none" />
                        <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event name" className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none" />
                        <input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College or issuer" className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none" />
                        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none" />
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" rows={4} className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none resize-none" />
                        <label className="flex flex-col gap-2 rounded-2xl glass border border-border/50 p-4 cursor-pointer">
                          <span className="text-sm text-foreground font-medium">Certificate PDF</span>
                          <span className="text-xs text-muted-foreground">Upload a PDF file.</span>
                          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                          <span className="text-sm text-primary">{file ? file.name : "Choose a file"}</span>
                        </label>
                        <button type="submit" disabled={uploadingCert} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition disabled:opacity-50">
                          {uploadingCert ? "Uploading..." : "Upload Certificate"}
                        </button>
                      </form>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal>
                    <div className="glass rounded-3xl border border-border/50 p-8">
                      <h2 className="font-heading text-2xl font-bold mb-4">Existing Certificates</h2>
                      {loading ? (
                        <p className="text-muted-foreground">Loading...</p>
                      ) : (!certificates.length ? (
                        <p className="text-muted-foreground">No certificates available yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {certificates.map((cert) => (
                            <div key={cert._id} className="rounded-3xl glass border border-border/50 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-foreground">{cert.title}</h3>
                                  <p className="text-xs text-muted-foreground">{cert.event} · {cert.college}</p>
                                  <p className="text-xs text-muted-foreground">{cert.location} · {cert.date}</p>
                                  <p className="mt-2 text-sm text-foreground/80">{cert.description}</p>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                  {cert.fileUrl && (
                                    <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                                      View PDF
                                    </a>
                                  )}
                                  {cert._id && (
                                    <button onClick={() => handleDeleteCertificate(cert._id!)} className="text-sm text-destructive hover:text-destructive/80">
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollReveal>
                </div>

                <div className="glass rounded-3xl border border-border/50 p-8">
                  <h2 className="font-heading text-2xl font-bold mb-4">Admin Notes</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This admin panel is protected by password authentication. You can upload new certificates and remove old ones from the public portfolio.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-[1fr_380px] gap-8">
                <div className="space-y-6">
                  <ScrollReveal>
                    <div className="glass rounded-3xl border border-border/50 p-8">
                      <h2 className="font-heading text-2xl font-bold mb-4">Add Project</h2>
                      <form onSubmit={handleProjectCreate} className="space-y-4">
                        <input value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Project title" className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none" />
                        <input value={projectRole} onChange={(e) => setProjectRole(e.target.value)} placeholder="Role" className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none" />
                        <input value={projectLink} onChange={(e) => setProjectLink(e.target.value)} placeholder="Project link (optional)" className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none" />
                        <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Short description" rows={4} className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none resize-none" />
                        <input value={projectHighlights} onChange={(e) => setProjectHighlights(e.target.value)} placeholder="Highlights (comma-separated)" className="w-full rounded-2xl glass px-4 py-3 text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none" />
                        <select value={projectGradient} onChange={(e) => setProjectGradient(e.target.value)} className="w-full rounded-2xl glass px-4 py-3 text-foreground border border-border/50 focus:outline-none">
                          <option value="from-neon-purple/20 to-neon-blue/5">Purple / Blue</option>
                          <option value="from-neon-violet/20 to-neon-magenta/5">Violet / Magenta</option>
                          <option value="from-accent/20 to-neon-cyan/5">Cyan / Purple</option>
                        </select>
                        <button type="submit" disabled={creatingProject} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition disabled:opacity-50">
                          {creatingProject ? "Creating..." : "Add Project"}
                        </button>
                      </form>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal>
                    <div className="glass rounded-3xl border border-border/50 p-8">
                      <h2 className="font-heading text-2xl font-bold mb-4">Existing Projects</h2>
                      {loading ? (
                        <p className="text-muted-foreground">Loading...</p>
                      ) : (!projects.length ? (
                        <p className="text-muted-foreground">No projects available yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {projects.map((project) => (
                            <div key={project._id} className="rounded-3xl glass border border-border/50 p-4">
                              <div className="flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                                    <p className="text-xs text-muted-foreground">{project.role}</p>
                                  </div>
                                  {project._id && (
                                    <button onClick={() => handleDeleteProject(project._id!)} className="text-sm text-destructive hover:text-destructive/80">
                                      Delete
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm text-foreground/80">{project.description}</p>
                                {project.highlights?.length ? (
                                  <p className="text-xs text-muted-foreground">Highlights: {project.highlights.join(', ')}</p>
                                ) : null}
                                {project.link ? (
                                  <a href={project.link} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                                    View project
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollReveal>
                </div>

                <div className="glass rounded-3xl border border-border/50 p-8">
                  <h2 className="font-heading text-2xl font-bold mb-4">Project Upload Instructions</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Use this form to add new project entries to the public portfolio. Highlights should be comma-separated keywords, and the optional link can point to a live demo or repository.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminPanel;
