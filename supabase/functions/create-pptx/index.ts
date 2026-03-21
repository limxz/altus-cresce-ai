import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import pptxgen from "npm:pptxgenjs@3.12.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { slides, clientName, clientBusiness } = await req.json();

    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Altus Media";
    pptx.company = "Altus Media";
    pptx.subject = `Apresentação para ${clientName}`;

    const primaryColor = "7C3AED";
    const darkBg = "08080F";
    const surfaceColor = "12101F";

    for (let i = 0; i < slides.length; i++) {
      const slide = pptx.addSlide();
      const s = slides[i];

      if (i === 0) {
        // Cover slide
        slide.background = { color: darkBg };
        slide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: "100%", h: "100%",
          fill: { type: "solid", color: primaryColor },
          transparency: 90,
        });
        slide.addText(s.title, {
          x: 0.8, y: 1.5, w: 11.5, h: 1.5,
          fontSize: 44, fontFace: "Arial",
          color: "FFFFFF", bold: true,
        });
        slide.addText(s.content, {
          x: 0.8, y: 3.2, w: 11.5, h: 1.5,
          fontSize: 22, fontFace: "Arial",
          color: "C4B5FD",
        });
        slide.addText(`Preparado para ${clientName} · ${clientBusiness}`, {
          x: 0.8, y: 5.5, w: 11.5, h: 0.6,
          fontSize: 14, fontFace: "Arial",
          color: "9CA3AF",
        });
      } else {
        // Content slide
        slide.background = { color: darkBg };
        // Purple accent bar
        slide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: 0.08, h: "100%",
          fill: { type: "solid", color: primaryColor },
        });
        slide.addText(s.title, {
          x: 0.8, y: 0.4, w: 11.5, h: 0.8,
          fontSize: 32, fontFace: "Arial",
          color: "FFFFFF", bold: true,
        });
        // Divider
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.8, y: 1.3, w: 2, h: 0.04,
          fill: { type: "solid", color: primaryColor },
        });
        slide.addText(s.content, {
          x: 0.8, y: 1.8, w: 11.5, h: 4.5,
          fontSize: 18, fontFace: "Arial",
          color: "D1D5DB",
          lineSpacingMultiple: 1.5,
          valign: "top",
        });
      }

      // Footer on every slide
      slide.addText("Altus Media · Cresce com Inteligência", {
        x: 0.8, y: 6.8, w: 8, h: 0.4,
        fontSize: 10, fontFace: "Arial",
        color: "6B7280",
      });
    }

    const output = await pptx.write({ outputType: "base64" });

    return new Response(JSON.stringify({ pptx: output }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("PPTX error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
