import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check preferences
    const { data: prefs } = await supabase
      .from("recap_preferences")
      .select("*")
      .limit(1)
      .single();

    if (!prefs?.is_enabled) {
      return new Response(JSON.stringify({ message: "Recap is disabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get today's date range (UTC)
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);
    const todayISO = todayStart.toISOString();
    const todayEndISO = todayEnd.toISOString();

    // --- GATHER DATA ---

    // 1. Tasks completed today
    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("*, owner:profiles(name)")
      .eq("status", "Done")
      .gte("created_at", todayISO)
      .lte("created_at", todayEndISO);

    // 2. All tasks with overdue/urgent
    const { data: allTasks } = await supabase
      .from("tasks")
      .select("*, owner:profiles(name)")
      .neq("status", "Done");

    const overdueTasks = (allTasks || []).filter(
      (t: any) => t.due_date && new Date(t.due_date) < now
    );
    const urgentTasks = (allTasks || []).filter(
      (t: any) => t.priority === "High"
    );

    // 3. Tasks due in next 7 days
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    const upcomingTasks = (allTasks || []).filter(
      (t: any) =>
        t.due_date &&
        new Date(t.due_date) >= now &&
        new Date(t.due_date) <= next7Days
    );

    // 4. New projects added today
    const { data: newProjects } = await supabase
      .from("projects")
      .select("*, account:accounts(name)")
      .gte("created_at", todayISO)
      .lte("created_at", todayEndISO);

    // 5. All active projects (exclude specified)
    let projectQuery = supabase
      .from("projects")
      .select("*, account:accounts(name)");

    if (prefs?.excluded_project_ids?.length > 0) {
      // Filter out excluded projects
      for (const excludedId of prefs.excluded_project_ids) {
        projectQuery = projectQuery.neq("id", excludedId);
      }
    }
    const { data: activeProjects } = await projectQuery;

    // 6. New contacts/investors added today
    const { data: newContacts } = await supabase
      .from("contacts")
      .select("*")
      .gte("created_at", todayISO)
      .lte("created_at", todayEndISO);

    const { data: newAccounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("type_of_account", "Investor")
      .gte("created_at", todayISO)
      .lte("created_at", todayEndISO);

    // 7. Recent activities
    const { data: todayActivities } = await supabase
      .from("activities")
      .select("*")
      .gte("activity_date", todayISO)
      .lte("activity_date", todayEndISO);

    // 8. Notes added today
    const { data: todayNotes } = await supabase
      .from("notes")
      .select("*")
      .gte("created_at", todayISO)
      .lte("created_at", todayEndISO);

    // 9. Projects with no recent activity (watchlist)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: recentActivities } = await supabase
      .from("activities")
      .select("what_id")
      .gte("activity_date", threeDaysAgo.toISOString());

    const activeProjectIds = new Set(
      (recentActivities || []).map((a: any) => a.what_id).filter(Boolean)
    );
    const staleProjects = (activeProjects || []).filter(
      (p: any) => !activeProjectIds.has(p.id)
    );

    // Build stats
    const stats = {
      tasksCompleted: (completedTasks || []).length,
      newProjects: (newProjects || []).length,
      newInvestors: (newAccounts || []).length,
      newContacts: (newContacts || []).length,
      urgentItems: overdueTasks.length + urgentTasks.length,
      staleProjects: staleProjects.length,
    };

    // --- GENERATE AI NARRATIVE ---
    let narrative =
      "Today was a quiet day across the portfolio with no significant activity recorded.";

    if (lovableApiKey) {
      try {
        const dataContext = `
Portfolio stats for today:
- Tasks completed: ${stats.tasksCompleted}
- New projects added: ${stats.newProjects}${newProjects?.length ? ": " + newProjects.map((p: any) => p.name).join(", ") : ""}
- New investors: ${stats.newInvestors}
- New contacts: ${stats.newContacts}
- Overdue tasks: ${overdueTasks.length}
- High priority tasks: ${urgentTasks.length}
- Active projects: ${(activeProjects || []).length}
- Projects with no activity in 3+ days: ${staleProjects.length}${staleProjects.length ? ": " + staleProjects.map((p: any) => p.name).join(", ") : ""}
- Activities logged today: ${(todayActivities || []).length}
- Notes added today: ${(todayNotes || []).length}
`;

        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a Chief of Staff writing a 2-4 sentence executive daily brief for a real estate development portfolio. Be confident, professional, concise. Reference specific numbers. If it was a quiet day, acknowledge that positively. Do NOT use markdown formatting, just plain text.",
                },
                {
                  role: "user",
                  content: `Write a daily executive brief based on this data:\n${dataContext}`,
                },
              ],
              stream: false,
            }),
          }
        );

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          narrative =
            aiData.choices?.[0]?.message?.content || narrative;
        } else {
          console.error("AI gateway error:", aiResponse.status, await aiResponse.text());
        }
      } catch (aiErr) {
        console.error("AI narrative generation failed:", aiErr);
      }
    }

    // --- BUILD HTML EMAIL ---
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Pipeline stages for visual indicator
    const pipelineStages = [
      "Ideation",
      "Pre-Dev",
      "Raising",
      "Entitlements",
      "Construction",
      "Stabilization",
      "Exit",
    ];

    const projectCards = (activeProjects || [])
      .map((project: any) => {
        const projectTasks = (completedTasks || []).filter(
          (t: any) => t.related_id === project.id
        );
        const projectOverdue = overdueTasks.filter(
          (t: any) => t.related_id === project.id
        );
        const projectUpcoming = upcomingTasks.filter(
          (t: any) => t.related_id === project.id
        );
        const projectNotes = (todayNotes || []).filter(
          (n: any) => n.related_id === project.id
        );

        const stageIndex = pipelineStages.indexOf(project.stage);
        const stageProgress = stageIndex >= 0
          ? Math.round(((stageIndex + 1) / pipelineStages.length) * 100)
          : 0;

        const stageBar = pipelineStages
          .map((s, i) => {
            const isActive = i <= stageIndex;
            return `<span style="display:inline-block;width:${Math.floor(100 / pipelineStages.length)}%;height:8px;background:${isActive ? "#C8A25E" : "#E0DDD7"};${i === 0 ? "border-radius:4px 0 0 4px;" : ""}${i === pipelineStages.length - 1 ? "border-radius:0 4px 4px 0;" : ""}"></span>`;
          })
          .join("");

        const overdueHtml = projectOverdue.length
          ? projectOverdue
              .map(
                (t: any) =>
                  `<div style="color:#DC2626;font-size:13px;padding:4px 0;">⚠️ ${t.subject} — ${t.owner?.name || "Unassigned"} (Due: ${t.due_date})</div>`
              )
              .join("")
          : '<div style="color:#6B7078;font-size:13px;">None</div>';

        const completedHtml = projectTasks.length
          ? projectTasks
              .map(
                (t: any) =>
                  `<div style="font-size:13px;padding:2px 0;">✅ ${t.subject}</div>`
              )
              .join("")
          : '<div style="color:#6B7078;font-size:13px;">No tasks completed today</div>';

        const upcomingHtml = projectUpcoming.length
          ? projectUpcoming
              .slice(0, 5)
              .map(
                (t: any) =>
                  `<div style="font-size:13px;padding:2px 0;">📅 ${t.subject} — Due: ${t.due_date}</div>`
              )
              .join("")
          : '<div style="color:#6B7078;font-size:13px;">No upcoming deadlines</div>';

        const notesHtml = projectNotes.length
          ? projectNotes
              .map(
                (n: any) =>
                  `<div style="font-size:13px;padding:2px 0;color:#6B7078;">💬 ${n.content.substring(0, 120)}${n.content.length > 120 ? "..." : ""}</div>`
              )
              .join("")
          : "";

        return `
          <div style="border:1px solid #E0DDD7;border-top:3px solid #C8A25E;border-radius:8px;padding:20px;margin-bottom:16px;background:#ffffff;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h3 style="margin:0;font-size:16px;font-weight:600;color:#0C1C2E;">${project.name}</h3>
              <span style="background:#FAF8F4;border:1px solid #E0DDD7;border-radius:4px;padding:2px 8px;font-size:12px;color:#0C1C2E;">${project.stage.replace(/_/g, " ")}</span>
            </div>
            <div style="margin-bottom:12px;">${stageBar}</div>
            <div style="margin-bottom:12px;">
              <div style="font-weight:600;font-size:13px;color:#0C1C2E;margin-bottom:4px;">Tasks Completed Today</div>
              ${completedHtml}
            </div>
            <div style="margin-bottom:12px;">
              <div style="font-weight:600;font-size:13px;color:#DC2626;margin-bottom:4px;">⚠️ Overdue Tasks</div>
              ${overdueHtml}
            </div>
            <div style="margin-bottom:12px;">
              <div style="font-weight:600;font-size:13px;color:#0C1C2E;margin-bottom:4px;">📅 Upcoming (Next 7 Days)</div>
              ${upcomingHtml}
            </div>
            ${notesHtml ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #E0DDD7;">${notesHtml}</div>` : ""}
          </div>
        `;
      })
      .join("");

    // Watchlist section
    const projectsWithMultipleOverdue = (activeProjects || []).filter(
      (p: any) =>
        overdueTasks.filter((t: any) => t.related_id === p.id).length >= 2
    );

    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    // Projects approaching deadline within 48hrs (simplified: check tasks due in 48hrs)
    const urgentDeadlineProjects = (activeProjects || []).filter((p: any) => {
      const projectUpcoming = (allTasks || []).filter(
        (t: any) =>
          t.related_id === p.id &&
          t.due_date &&
          new Date(t.due_date) <= twoDaysFromNow &&
          new Date(t.due_date) >= now
      );
      return projectUpcoming.length > 0;
    });

    const watchlistItems: string[] = [];
    staleProjects.forEach((p: any) => {
      watchlistItems.push(
        `<div style="padding:6px 0;font-size:13px;">🔇 <strong>${p.name}</strong> — No activity in 3+ days</div>`
      );
    });
    projectsWithMultipleOverdue.forEach((p: any) => {
      const count = overdueTasks.filter(
        (t: any) => t.related_id === p.id
      ).length;
      watchlistItems.push(
        `<div style="padding:6px 0;font-size:13px;color:#DC2626;">🚨 <strong>${p.name}</strong> — ${count} overdue tasks</div>`
      );
    });
    urgentDeadlineProjects.forEach((p: any) => {
      watchlistItems.push(
        `<div style="padding:6px 0;font-size:13px;color:#D97706;">⏰ <strong>${p.name}</strong> — Tasks due within 48 hours</div>`
      );
    });

    const watchlistHtml = watchlistItems.length
      ? watchlistItems.join("")
      : '<div style="color:#6B7078;font-size:13px;">All projects are on track. No items to flag.</div>';

    const appUrl = Deno.env.get("APP_URL") || "https://caps-nexus-crm.lovable.app";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Portfolio Recap</title>
</head>
<body style="margin:0;padding:0;background:#FAF8F4;font-family:'Montserrat',Helvetica,Arial,sans-serif;color:#1A1A1A;">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    
    <!-- Header -->
    <div style="background:#0C1C2E;border-radius:8px 8px 0 0;padding:24px 32px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:600;color:#FAF8F4;">Daily Portfolio Recap</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#C8A25E;">${dateStr}</p>
    </div>

    <!-- Narrative Brief -->
    <div style="background:#ffffff;padding:24px 32px;border-left:1px solid #E0DDD7;border-right:1px solid #E0DDD7;">
      <h2 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#0C1C2E;border-bottom:2px solid #C8A25E;padding-bottom:8px;">Executive Brief</h2>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#1A1A1A;">${narrative}</p>
    </div>

    <!-- Stats Block -->
    <div style="background:#FAF8F4;padding:20px 32px;border:1px solid #E0DDD7;border-top:none;">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0C1C2E;">Today at a Glance</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;font-size:14px;">✅ Tasks Completed Today</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;">${stats.tasksCompleted}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;">📁 New Projects Added</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;">${stats.newProjects}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;">👤 New Investors / Contacts</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;">${stats.newInvestors + stats.newContacts}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:14px;">⚠️ Urgent Items Flagged</td>
          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;${stats.urgentItems > 0 ? "color:#DC2626;" : ""}">${stats.urgentItems}</td>
        </tr>
      </table>
    </div>

    <!-- Portfolio Breakdown -->
    <div style="background:#ffffff;padding:24px 32px;border:1px solid #E0DDD7;border-top:none;">
      <h2 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#0C1C2E;border-bottom:2px solid #C8A25E;padding-bottom:8px;">Portfolio Breakdown</h2>
      ${(activeProjects || []).length > 0 ? projectCards : '<p style="color:#6B7078;font-size:14px;">No active projects in the portfolio.</p>'}
    </div>

    <!-- Watchlist -->
    <div style="background:#FAF8F4;padding:20px 32px;border:1px solid #E0DDD7;border-top:none;">
      <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0C1C2E;">🔍 Watchlist</h3>
      ${watchlistHtml}
    </div>

    <!-- CTA -->
    <div style="background:#ffffff;padding:24px 32px;border:1px solid #E0DDD7;border-top:none;text-align:center;">
      <a href="${appUrl}/dashboard" style="display:inline-block;background:#0C1C2E;color:#FAF8F4;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">View in App</a>
    </div>

    <!-- Footer -->
    <div style="background:#0C1C2E;border-radius:0 0 8px 8px;padding:16px 32px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#6B7078;">CAPS Capital Enterprises — Daily Recap</p>
      <p style="margin:4px 0 0;font-size:11px;color:#6B7078;">
        <a href="${appUrl}/recap-settings" style="color:#C8A25E;text-decoration:none;">Manage Preferences</a> · 
        <a href="${appUrl}/recap-settings" style="color:#C8A25E;text-decoration:none;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>`;

    const subject = `Portfolio Recap — ${dateStr}`;

    // --- GET RECIPIENTS ---
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("email, name");

    const recipients = (allProfiles || [])
      .map((p: any) => p.email)
      .filter(Boolean);

    // --- SEND EMAIL (via Lovable transactional email if available) ---
    // For now, we log the recap and make it viewable in-app
    // Email sending will be activated once a domain is configured

    // Log the recap
    const { error: logError } = await supabase.from("recap_logs").insert({
      subject,
      html_body: emailHtml,
      narrative,
      stats,
      recipient_count: recipients.length,
      status: "generated",
    });

    if (logError) {
      console.error("Error logging recap:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        subject,
        recipientCount: recipients.length,
        stats,
        narrative,
        message: "Recap generated and logged. Email delivery will be active once an email domain is configured.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Daily recap error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
