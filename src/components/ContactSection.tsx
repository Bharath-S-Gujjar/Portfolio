import { Mail, Phone, Github, Linkedin } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { sendContactMessage } from "@/lib/api";
import ScrollReveal from "./ScrollReveal";
import { motion } from "framer-motion";

const ContactSection = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await sendContactMessage(formData);
      toast({ title: "Message sent successfully! 🎉" });
      setFormData({ name: "", email: "", message: "" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to send message. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-3.5 rounded-xl glass text-foreground placeholder:text-transparent focus:outline-none transition-all duration-300 peer ${
      focused === field ? "border-primary/50 shadow-[0_0_20px_hsl(250_90%_65%/0.15)]" : "border-border/50"
    }`;

  const FloatingInput = ({ name, label, type = "text" }: { name: string; label: string; type?: string }) => (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={formData[name as keyof typeof formData]}
        onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
        onFocus={() => setFocused(name)}
        onBlur={() => setFocused(null)}
        className={inputClass(name)}
        placeholder={label}
      />
      <label
        className={`absolute left-4 transition-all duration-300 pointer-events-none ${
          formData[name as keyof typeof formData] || focused === name
            ? "text-xs text-primary -top-2.5 bg-background px-2 rounded"
            : "text-sm text-muted-foreground top-3.5"
        }`}
      >
        {label}
      </label>
    </div>
  );

  return (
    <section id="contact" className="py-28 relative">
      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal>
          <h2 className="font-heading text-4xl md:text-5xl font-bold gradient-text mb-16">Get In Touch</h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-12">
          <ScrollReveal direction="left" delay={0.1}>
            <div className="space-y-8">
              <p className="text-secondary-foreground leading-relaxed">
                I'm always open to discussing new projects, creative ideas, or opportunities to be part of something great.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: "bharathsgujjar635@gmail.com", href: "mailto:bharathsgujjar635@gmail.com" },
                  { icon: Phone, label: "+91 7022441738", href: "tel:+917022441738" },
                  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
                  { icon: Github, label: "GitHub", href: "https://github.com" },
                ].map((item) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
                    whileHover={{ x: 6 }}
                  >
                    <item.icon size={18} className="group-hover:text-primary transition-colors" />
                    {item.label}
                  </motion.a>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.2}>
            <form ref={formRef} className="space-y-5" onSubmit={handleSubmit}>
              <FloatingInput name="name" label="Your Name" />
              <FloatingInput name="email" label="Your Email" type="email" />
              <div className="relative">
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  onFocus={() => setFocused("message")}
                  onBlur={() => setFocused(null)}
                  className={`${inputClass("message")} resize-none`}
                  placeholder="Your Message"
                />
                <label
                  className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                    formData.message || focused === "message"
                      ? "text-xs text-primary -top-2.5 bg-background px-2 rounded"
                      : "text-sm text-muted-foreground top-3.5"
                  }`}
                >
                  Your Message
                </label>
              </div>
              <motion.button
                type="submit"
                disabled={sending}
                className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold magnetic-btn relative overflow-hidden group disabled:opacity-50"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10">{sending ? "Sending..." : "Send Message"}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </form>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
