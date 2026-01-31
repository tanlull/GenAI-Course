import fs from "fs";
import path from "path";
import PhotoGenerator from "./components/PhotoGenerator";

export default function Home() {
  // Server-side: Read template files from public/templates
  const templatesDir = path.join(process.cwd(), "public", "templates");
  let templates: string[] = [];

  try {
    const files = fs.readdirSync(templatesDir);
    // Filter for images only
    templates = files.filter((file) => /\.(png|jpg|jpeg|webp)$/i.test(file));
  } catch (error) {
    console.error("Error reading templates directory:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <PhotoGenerator templates={templates} />
    </main>
  );
}
