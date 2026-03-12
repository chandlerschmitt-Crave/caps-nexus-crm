// Document Parser — Uses Anthropic Claude API only
// Model: claude-opus-4-5-20251101
// Do not replace with Gemini or other providers

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EXTRACTION_PROMPT = `You are a document data extraction engine for a real estate development & investment CRM. 
Analyze the provided document and extract ALL relevant structured data.

Return a JSON object with the following structure. For each field you find, include:
- "value": the extracted value (string or number)
- "confidence": confidence score 0-100
- "source_text": the exact text from the document where you found this

Only include fields you actually find in the document. Do not fabricate data.

{
  "financial": {
    "total_project_cost": { "value": number, "confidence": number, "source_text": string },
    "equity_requirement": { ... },
    "debt_amount": { ... },
    "preferred_return_pct": { ... },
    "target_irr_pct": { ... },
    "projected_irr_pct": { ... },
    "equity_multiple": { ... },
    "cash_yield_pct": { ... },
    "noi_annual": { ... },
    "noi_monthly": { ... },
    "capex_gross": { ... },
    "capex_net": { ... },
    "incentives_secured": { ... },
    "yield_on_cost_pct": { ... },
    "hold_period_years": { ... },
    "target_close_date": { ... },
    "dscr": { ... }
  },
  "deal_project": {
    "project_name": { ... },
    "location_city": { ... },
    "location_state": { ... },
    "project_type": { ... },
    "stage": { ... },
    "loi_date": { ... },
    "closing_date": { ... },
    "construction_start": { ... },
    "completion_date": { ... },
    "deal_instrument": { ... }
  },
  "investor_party": {
    "investor_name": { ... },
    "contact_name": { ... },
    "contact_email": { ... },
    "committed_capital": { ... },
    "lp_split_pct": { ... },
    "gp_split_pct": { ... },
    "promote_pct": { ... }
  },
  "voltqore": {
    "total_stalls": { ... },
    "site_location": { ... },
    "utilization_target_pct": { ... },
    "tesla_om_terms": { ... },
    "lcfs_credits_monthly": { ... },
    "itc_amount": { ... },
    "avg_session_price_kwh": { ... }
  },
  "property": {
    "address": { ... },
    "apn": { ... },
    "arv": { ... },
    "land_cost": { ... },
    "construction_budget": { ... },
    "soft_costs": { ... },
    "city": { ... },
    "state": { ... }
  }
}

Return ONLY the JSON object, no other text.`;

const FIELD_MAP: Record<string, string> = {
  "financial.total_project_cost": "project_financials.total_project_cost",
  "financial.equity_requirement": "project_financials.total_equity_raised",
  "financial.debt_amount": "project_financials.total_debt_raised",
  "financial.preferred_return_pct": "capital_stacks.preferred_return_pct",
  "financial.target_irr_pct": "project_financials.target_irr_pct",
  "financial.projected_irr_pct": "project_financials.projected_irr_pct",
  "financial.equity_multiple": "project_financials.target_equity_multiple",
  "financial.cash_yield_pct": "project_financials.target_yield_on_cost_pct",
  "financial.noi_annual": "project_financials.target_noi",
  "financial.capex_gross": "voltqore_site_metrics.gross_capex",
  "financial.capex_net": "voltqore_site_metrics.net_capex",
  "financial.incentives_secured": "voltqore_site_metrics.incentives_secured",
  "financial.yield_on_cost_pct": "voltqore_site_metrics.yield_on_cost_pct",
  "financial.hold_period_years": "project_financials.hold_period_years",
  "financial.target_close_date": "project_financials.target_close_date",
  "financial.dscr": "project_financials.dscr",
  "deal_project.project_name": "projects.name",
  "deal_project.location_city": "projects.market",
  "deal_project.project_type": "projects.project_type",
  "deal_project.stage": "projects.stage",
  "deal_project.deal_instrument": "deals.instrument",
  "deal_project.closing_date": "deals.close_date",
  "investor_party.investor_name": "accounts.name",
  "investor_party.contact_name": "contacts.first_name",
  "investor_party.contact_email": "contacts.email",
  "investor_party.committed_capital": "capital_stacks.committed_amount",
  "investor_party.lp_split_pct": "capital_stacks.lp_split_above_hurdle_pct",
  "investor_party.gp_split_pct": "capital_stacks.gp_split_above_hurdle_pct",
  "investor_party.promote_pct": "capital_stacks.promote_pct",
  "voltqore.total_stalls": "voltqore_site_metrics.total_stalls",
  "voltqore.site_location": "voltqore_site_metrics.location_city",
  "voltqore.utilization_target_pct": "voltqore_site_metrics.utilization_target_pct",
  "voltqore.lcfs_credits_monthly": "voltqore_site_metrics.lcfs_credits_monthly",
  "voltqore.avg_session_price_kwh": "voltqore_site_metrics.avg_session_price_kwh",
  "property.address": "properties.address",
  "property.apn": "properties.apn",
  "property.arv": "properties.arv",
  "property.land_cost": "properties.land_cost",
  "property.construction_budget": "properties.construction_budget",
  "property.soft_costs": "properties.softs",
  "property.city": "properties.city",
  "property.state": "properties.state",
};

function flattenExtracted(obj: Record<string, any>, prefix = ""): Array<{ path: string; value: any; confidence: number; source: string }> {
  const results: Array<{ path: string; value: any; confidence: number; source: string }> = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && "value" in val && "confidence" in val) {
      results.push({
        path: fullKey,
        value: val.value,
        confidence: val.confidence,
        source: val.source_text || "",
      });
    } else if (val && typeof val === "object") {
      results.push(...flattenExtracted(val, fullKey));
    }
  }
  return results;
}

// Determine media type from file extension or URL
function getMediaType(url: string, title: string): string {
  const combined = (url + title).toLowerCase();
  if (combined.includes(".pdf")) return "application/pdf";
  if (combined.includes(".png")) return "image/png";
  if (combined.includes(".jpg") || combined.includes(".jpeg")) return "image/jpeg";
  if (combined.includes(".gif")) return "image/gif";
  if (combined.includes(".webp")) return "image/webp";
  // Default to PDF for financial documents
  return "application/pdf";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { document_id } = await req.json();
    if (!document_id) throw new Error("document_id is required");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch document record
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docErr || !doc) throw new Error("Document not found");

    // Update status to Processing
    await supabase.from("documents").update({ parse_status: "Processing" }).eq("id", document_id);

    // Download file from storage as base64
    let fileBase64 = "";
    let mediaType = "application/pdf";
    const url = doc.url;

    if (url && url.includes("/storage/")) {
      const pathMatch = url.match(/\/object\/(?:public|sign)\/(.+)/);
      if (pathMatch) {
        const storagePath = pathMatch[1].replace("documents/", "");
        const { data: fileData, error: dlErr } = await supabase.storage
          .from("documents")
          .download(storagePath);

        if (!dlErr && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          // Convert to base64
          let binary = "";
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          fileBase64 = btoa(binary);
          mediaType = getMediaType(url, doc.title || "");
        }
      }
    }

    // Build Claude API message content
    const messageContent: any[] = [];

    if (fileBase64) {
      // Use Claude's native document/image reading capability
      const isImage = mediaType.startsWith("image/");
      messageContent.push({
        type: isImage ? "image" : "document",
        source: {
          type: "base64",
          media_type: mediaType,
          data: fileBase64,
        },
      });
    }

    const docTypeHint = doc.doc_type || "Unknown";
    messageContent.push({
      type: "text",
      text: `Document Type: ${docTypeHint}\n\n${EXTRACTION_PROMPT}`,
    });

    // If no file content was available, add a note
    if (!fileBase64) {
      messageContent.unshift({
        type: "text",
        text: `Document Title: ${doc.title}\nDocument Type: ${docTypeHint}\nURL: ${doc.url}\n\nNote: Could not access file content directly. Extract any data from the metadata above.`,
      });
    }

    // Call Anthropic Claude API directly
    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-5-20251101",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Anthropic API error:", aiResponse.status, errText);

      await supabase.from("documents").update({ parse_status: "Failed" }).eq("id", document_id);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid ANTHROPIC_API_KEY. Check your API key configuration." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`Anthropic API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Extract JSON from Claude's text response
    let extractedData: Record<string, any> = {};
    const textContent = aiData.content?.find((c: any) => c.type === "text");
    if (textContent?.text) {
      try {
        // Try parsing the entire response as JSON first
        extractedData = JSON.parse(textContent.text);
      } catch {
        // Fall back to extracting JSON from within the text
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      }
    }

    // Flatten and create field mappings
    const fields = flattenExtracted(extractedData);
    const avgConfidence = fields.length > 0
      ? fields.reduce((s, f) => s + f.confidence, 0) / fields.length
      : 0;

    // Delete old mappings for re-parse
    await supabase.from("parse_field_mappings").delete().eq("document_id", document_id);

    // Insert new mappings
    if (fields.length > 0) {
      const mappings = fields.map((f) => ({
        document_id,
        field_path: FIELD_MAP[f.path] || f.path,
        extracted_value: String(f.value),
        suggested_value: String(f.value),
        confidence_pct: f.confidence,
        status: "Pending_Review",
      }));

      await supabase.from("parse_field_mappings").insert(mappings);
    }

    // Update document
    await supabase.from("documents").update({
      parse_status: "Extracted",
      parsed_at: new Date().toISOString(),
      extracted_data: extractedData,
      parse_confidence: Math.round(avgConfidence),
    }).eq("id", document_id);

    return new Response(
      JSON.stringify({
        success: true,
        fields_extracted: fields.length,
        avg_confidence: Math.round(avgConfidence),
        data: extractedData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
