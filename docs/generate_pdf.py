import os
import sys
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8.5)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (on pages after cover)
        if self._pageNumber > 1:
            self.drawString(36, 810, "CampusConnect — Placement Drive Technical Report & Viva Guide")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(36, 804, 559, 804)

        # Footer
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(36, 36, 559, 36)
        
        self.drawString(36, 24, "Confidential • Campus Placement Drive Preparation")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(559, 24, page_text)
        self.restoreState()

def build_pdf():
    pdf_path = os.path.join(os.path.dirname(__file__), "CampusConnect_Placement_Drive_Report.pdf")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#059669")
    indigo_color = colors.HexColor("#4F46E5")
    text_dark = colors.HexColor("#0F172A")
    text_muted = colors.HexColor("#475569")
    bg_light = colors.HexColor("#F8FAFC")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#FFFFFF"),
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#E2E8F0"),
        alignment=TA_LEFT
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=text_dark,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=text_dark
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    pitch_style = ParagraphStyle(
        'PitchText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1E293B")
    )

    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A")
    )

    table_header_style = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#FFFFFF")
    )

    table_cell_style = ParagraphStyle(
        'TD',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=text_dark
    )

    table_cell_bold = ParagraphStyle(
        'TDBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=text_dark
    )

    qa_q_style = ParagraphStyle(
        'QAQuestion',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13.5,
        textColor=colors.HexColor("#064E3B")
    )

    qa_a_style = ParagraphStyle(
        'QAAnswer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_dark
    )

    story = []

    # 1. Header Banner Box (Cover / Hero)
    banner_data = [
        [
            Paragraph("CAMPUS RECRUITMENT & VIVA PREPARATION REPORT", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.HexColor("#A7F3D0"))),
        ],
        [
            Paragraph("CampusConnect 🚀", title_style)
        ],
        [
            Paragraph("Full-Stack, Real-Time Campus Collaboration, Innovation & Micro-Gigs Marketplace", subtitle_style)
        ],
        [
            Paragraph("<b>Stack:</b> React Native (Expo) • TypeScript • Node.js • Express • PostgreSQL (Neon) • Prisma ORM • Socket.io", ParagraphStyle('Meta', fontName='Helvetica', fontSize=8.5, textColor=colors.HexColor("#CBD5E1")))
        ]
    ]

    banner_table = Table(banner_data, colWidths=[523])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#064E3B")),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 12))

    # 2. Executive Pitches
    story.append(Paragraph("1. Executive Summary & Placement Pitches", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=8))

    pitch_30s = [
        [Paragraph("<b>30-Second HR Elevator Pitch</b>", ParagraphStyle('PT', fontName='Helvetica-Bold', fontSize=9, textColor=primary_color))],
        [Paragraph('"CampusConnect is a production-ready, real-time campus collaboration and talent ecosystem built with React Native, TypeScript, Node.js, Express, PostgreSQL via Prisma ORM, and Socket.io. It bridges academic silos by allowing students to pitch cross-departmental projects, recruit teammates via an automated application lifecycle, earn bounties through micro-gigs, and collaborate in real-time with WebSockets. Built with enterprise security including JWT token rotation, 2-Factor Authentication, and optimistic UI updates, it demonstrates modern full-stack systems engineering."', pitch_style)]
    ]
    t_30s = Table(pitch_30s, colWidths=[523])
    t_30s.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F0FDF4")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#BBF7D0")),
        ('LINELEFT', (0,0), (0,-1), 3.5, primary_color),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_30s)
    story.append(Spacer(1, 8))

    pitch_2m = [
        [Paragraph("<b>2-Minute In-Depth Technical Pitch</b>", ParagraphStyle('PT2', fontName='Helvetica-Bold', fontSize=9, textColor=indigo_color))],
        [Paragraph('"In university campuses, engineering, design, and business students operate in silos. Finding complementary talent for hackathons, capstones, and startups requires relying on informal chat groups where messages get lost. CampusConnect solves this through a dedicated multi-module platform:<br/>'
                   '1. An <b>Innovation Board</b> supporting project discovery, tech-stack filtering, and concurrent upvoting.<br/>'
                   '2. An <b>Application & Team Formation Engine</b> where accepting a team applicant automatically provisions a PostgreSQL Team record, updates roles, creates a private TEAM chat conversation, and broadcasts automated welcome messages and push notifications.<br/>'
                   '3. An <b>Internal Campus Gigs Marketplace</b> for peer-to-peer micro-tasks and bounties with stipend negotiation.<br/>'
                   '4. A <b>Real-Time WebSocket Engine</b> using Socket.io for typing indicators, bi-directional instant messaging, and live notifications.<br/>'
                   '5. A <b>Robust Security & Auth Architecture</b> supporting 2-Factor Authentication (OTP verification), bcrypt password hashing, and short-lived JWT access tokens paired with rotated refresh tokens in PostgreSQL.<br/>'
                   'I built this as a full-stack monorepo with 100% TypeScript type safety from database models to UI components, with passing integration test suites and automated database pooling."', pitch_style)]
    ]
    t_2m = Table(pitch_2m, colWidths=[523])
    t_2m.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F5F3FF")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#DDD6FE")),
        ('LINELEFT', (0,0), (0,-1), 3.5, indigo_color),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_2m)
    story.append(Spacer(1, 14))

    # 3. System Architecture & Tech Stack Justification
    story.append(Paragraph("2. System Architecture & Tech Stack Justification", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=8))

    tech_table_data = [
        [Paragraph("Layer / Tool", table_header_style), Paragraph("Technology", table_header_style), Paragraph("Engineering Justification Over Alternatives", table_header_style)],
        [Paragraph("Mobile Client", table_cell_bold), Paragraph("React Native (Expo) + TS", table_cell_style), Paragraph("Cross-platform codebase (iOS, Android, Web). Native 60fps performance without writing duplicate Swift & Kotlin.", table_cell_style)],
        [Paragraph("State Store", table_cell_bold), Paragraph("Zustand", table_cell_style), Paragraph("Lightweight, hook-based state management with zero Redux boilerplate and seamless Socket.io store integration.", table_cell_style)],
        [Paragraph("Backend", table_cell_bold), Paragraph("Node.js + Express", table_cell_style), Paragraph("Asynchronous, non-blocking event-driven runtime ideal for real-time WebSockets and concurrent queries.", table_cell_style)],
        [Paragraph("Database", table_cell_bold), Paragraph("Neon PostgreSQL", table_cell_style), Paragraph("ACID relational guarantees essential for recruitment applications, foreign keys with cascade deletions, and compound unique constraints.", table_cell_style)],
        [Paragraph("ORM", table_cell_bold), Paragraph("Prisma 5", table_cell_style), Paragraph("End-to-end type safety, auto-generated migrations, and native protection against SQL Injection attacks.", table_cell_style)],
        [Paragraph("Real-Time", table_cell_bold), Paragraph("Socket.io", table_cell_style), Paragraph("Bi-directional event channels, logical room broadcasting (<code>conversation:id</code>), and automatic HTTP polling fallback.", table_cell_style)],
        [Paragraph("Security", table_cell_bold), Paragraph("JWT + Bcrypt + 2FA", table_cell_style), Paragraph("Short-lived access tokens (15m) + database-persisted refresh token rotation (7d) and 6-digit OTP verification.", table_cell_style)]
    ]

    t_tech = Table(tech_table_data, colWidths=[85, 120, 318])
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), text_dark),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 14))

    # 4. UI/UX Modernization
    story.append(Paragraph("3. UI/UX Transformations & Design Decisions", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=8))

    ui_table_data = [
        [Paragraph("Screen / Area", table_header_style), Paragraph("UI / UX Modernization Made", table_header_style), Paragraph("Placement Walkthrough Impact", table_header_style)],
        [Paragraph("Header & Nav", table_cell_bold), Paragraph("Branded title with emerald HUB badge; interactive user profile chip with initials; floating bottom tabs with active pill indicators.", table_cell_style), Paragraph("Demonstrates mastery of mobile layout geometry and clean navigation flow hierarchy.", table_cell_style)],
        [Paragraph("Ideas Board", table_cell_bold), Paragraph("Search box with icon & clear button; tech filter chips; author avatar pills; live pulsing dot status badges (🟢 Recruiting); optimistic upvote pills.", table_cell_style), Paragraph("Exhibits optimistic UI rendering and complex list virtualization with instant user feedback.", table_cell_style)],
        [Paragraph("Campus Gigs", table_cell_bold), Paragraph("Category filter pills with emojis (💻, ⚙️, 🎨); gold/amber stipend badges; duration estimates; clean application modal overlay.", table_cell_style), Paragraph("Demonstrates responsive dialog styling, multi-filter querying, and marketplace ergonomics.", table_cell_style)],
        [Paragraph("Chat Engine", table_cell_bold), Paragraph("Team group vs direct chat avatar icons; message preview snippets; asymmetric speech bubbles (chat-tail effect); typing indicator dot.", table_cell_style), Paragraph("Shows real-time chat UX design matching Slack/WhatsApp campus community standards.", table_cell_style)],
        [Paragraph("Alerts Feed", table_cell_bold), Paragraph("Categorized event badges (🚀, 💬, 🤝, 🔔); soft light-emerald unread highlight; one-tap 'Mark all read' header action.", table_cell_style), Paragraph("Proves understanding of event-driven notification systems with unread state tracking.", table_cell_style)],
        [Paragraph("Student Profile", table_cell_bold), Paragraph("Hero card with verified student badge; academic metrics bar (skills count, interests, grad year); interactive GitHub & Portfolio link cards.", table_cell_style), Paragraph("Showcases student resume & skill representation within a university network.", table_cell_style)]
    ]

    t_ui = Table(ui_table_data, colWidths=[90, 230, 203])
    t_ui.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), text_dark),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
    ]))
    story.append(t_ui)
    story.append(Spacer(1, 14))

    # Page Break for Module Breakdown
    story.append(PageBreak())

    # 5. Module & Function Reference
    story.append(Paragraph("4. Complete Module & Function Reference", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=8))

    fn_table_data = [
        [Paragraph("Module", table_header_style), Paragraph("Function & Route", table_header_style), Paragraph("Inputs", table_header_style), Paragraph("Internal Logic & Database Operations", table_header_style)],
        # Auth
        [Paragraph("Auth", table_cell_bold), Paragraph("<b>register</b><br/>POST /api/auth/register", table_cell_style), Paragraph("email, password, fullName, branch, gradYear", table_cell_style), Paragraph("Zod validation; Bcrypt hashing (10 rounds); creates User & Profile in atomic transaction; returns JWT pair.", table_cell_style)],
        [Paragraph("Auth", table_cell_bold), Paragraph("<b>login</b><br/>POST /api/auth/login", table_cell_style), Paragraph("email, password", table_cell_style), Paragraph("Finds user by email; verifies password with bcrypt.compare; generates and persists rotated refresh token.", table_cell_style)],
        [Paragraph("Auth", table_cell_bold), Paragraph("<b>sendOtp</b><br/>POST /api/auth/send-otp", table_cell_style), Paragraph("email", table_cell_style), Paragraph("Generates random 6-digit OTP; stores in cache with 10-minute TTL; dispatches verification code.", table_cell_style)],
        [Paragraph("Auth", table_cell_bold), Paragraph("<b>verifyOtp</b><br/>POST /api/auth/verify-otp", table_cell_style), Paragraph("email, code", table_cell_style), Paragraph("Validates OTP code and expiration; invalidates code upon success to complete 2FA login.", table_cell_style)],
        [Paragraph("Auth", table_cell_bold), Paragraph("<b>refreshToken</b><br/>POST /api/auth/refresh-token", table_cell_style), Paragraph("refreshToken", table_cell_style), Paragraph("Verifies refresh token signature; queries RefreshToken table; deletes used token and creates new rotated pair.", table_cell_style)],
        # Projects
        [Paragraph("Projects", table_cell_bold), Paragraph("<b>getProjects</b><br/>GET /api/projects", table_cell_style), Paragraph("search, branch, techStack, page, limit", table_cell_style), Paragraph("Dynamic Prisma where filter; case-insensitive search; pagination (skip/take); computes hasUpvoted flag.", table_cell_style)],
        [Paragraph("Projects", table_cell_bold), Paragraph("<b>createProject</b><br/>POST /api/projects", table_cell_style), Paragraph("title, summary, description, techStack", table_cell_style), Paragraph("Zod schema validation; assigns ownerId from JWT; inserts project record into PostgreSQL.", table_cell_style)],
        [Paragraph("Projects", table_cell_bold), Paragraph("<b>toggleUpvote</b><br/>POST /api/projects/:id/upvote", table_cell_style), Paragraph("params.id", table_cell_style), Paragraph("Atomic query against compound unique key [projectId, userId]; deletes if existing, inserts if absent.", table_cell_style)],
        # Teams
        [Paragraph("Teams", table_cell_bold), Paragraph("<b>applyToProject</b><br/>POST /api/projects/:id/apply", table_cell_style), Paragraph("params.id, note, contactLink", table_cell_style), Paragraph("Validates applicant != owner; checks unique constraint; creates Application; emits live socket notification.", table_cell_style)],
        [Paragraph("Teams", table_cell_bold), Paragraph("<b>updateAppStatus</b><br/>PATCH /api/applications/:id/status", table_cell_style), Paragraph("params.id, status", table_cell_style), Paragraph("<b>Core Flow:</b> If ACCEPTED: updates app; creates Team; assigns OWNER/MEMBER roles; auto-creates TEAM Chat; injects welcome message; pushes live notification.", table_cell_style)],
        # Gigs
        [Paragraph("Gigs", table_cell_bold), Paragraph("<b>getGigs / createGig</b><br/>GET & POST /api/gigs", table_cell_style), Paragraph("title, stipend, skills, category", table_cell_style), Paragraph("Queries open gigs with category filters; inserts new bounties; tracks student applicants.", table_cell_style)],
        # Chat
        [Paragraph("Chat", table_cell_bold), Paragraph("<b>getMessages</b><br/>GET /api/chat/:id/messages", table_cell_style), Paragraph("params.id", table_cell_style), Paragraph("Verifies participant authorization; fetches chronological messages; updates lastReadAt timestamp.", table_cell_style)],
        [Paragraph("Chat", table_cell_bold), Paragraph("<b>send_message</b><br/>WS event: send_message", table_cell_style), Paragraph("conversationId, content", table_cell_style), Paragraph("Persists message in PostgreSQL via Prisma; broadcasts to conversation room via Socket.io.", table_cell_style)],
        # Notifications
        [Paragraph("Notifs", table_cell_bold), Paragraph("<b>getNotifications</b><br/>GET /api/notifications", table_cell_style), Paragraph("Bearer Token", table_cell_style), Paragraph("Retrieves notifications by userId ordered by date; calculates unread counter; supports mark-all-read.", table_cell_style)],
    ]

    t_fn = Table(fn_table_data, colWidths=[55, 125, 115, 228])
    t_fn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), text_dark),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
    ]))
    story.append(t_fn)
    story.append(Spacer(1, 14))

    # 6. Database Schema Design
    story.append(Paragraph("5. Relational Database Design (Prisma Schema)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=8))

    schema_data = [
        [Paragraph("Model", table_header_style), Paragraph("Cardinality & Relations", table_header_style), Paragraph("Integrity Constraints & Indexing Strategy", table_header_style)],
        [Paragraph("User & Profile", table_cell_bold), Paragraph("User (1:1) Profile", table_cell_style), Paragraph("<code>email @unique</code>. Profile cascades on user deletion (<code>onDelete: Cascade</code>).", table_cell_style)],
        [Paragraph("RefreshToken", table_cell_bold), Paragraph("User (1:N) RefreshToken", table_cell_style), Paragraph("<code>token @unique</code>. Stored hashed with expiration dates for instant session revocation.", table_cell_style)],
        [Paragraph("ProjectUpvote", table_cell_bold), Paragraph("Project (1:N) ProjectUpvote", table_cell_style), Paragraph("<b>Compound Unique:</b> <code>@@unique([projectId, userId])</code> prevents duplicate votes.", table_cell_style)],
        [Paragraph("Application", table_cell_bold), Paragraph("Project (1:N) Application", table_cell_style), Paragraph("<b>Compound Unique:</b> <code>@@unique([projectId, userId])</code> guarantees recruitment idempotency.", table_cell_style)],
        [Paragraph("TeamMember", table_cell_bold), Paragraph("Team (1:N) TeamMember", table_cell_style), Paragraph("<code>projectId @unique</code> on Team. <code>@@unique([teamId, userId])</code> prevents duplicate roster entries.", table_cell_style)],
        [Paragraph("Message", table_cell_bold), Paragraph("ChatConversation (1:N) Message", table_cell_style), Paragraph("<code>@@index([conversationId, createdAt])</code> accelerates chronological chat pagination.", table_cell_style)],
        [Paragraph("Notification", table_cell_bold), Paragraph("User (1:N) Notification", table_cell_style), Paragraph("<code>@@index([userId, isRead])</code> optimizes unread badge count queries.", table_cell_style)],
    ]

    t_schema = Table(schema_data, colWidths=[90, 150, 283])
    t_schema.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), text_dark),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 4.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, bg_light]),
    ]))
    story.append(t_schema)
    story.append(Spacer(1, 14))

    # Page Break for Top 15 Viva Q&A
    story.append(PageBreak())

    # 7. Viva Q&A
    story.append(Paragraph("6. Placement Drive Technical Viva Question Bank (Top 15 Q&As)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E2E8F0"), spaceAfter=10))

    qas = [
        ("Q1: Why choose PostgreSQL over MongoDB for CampusConnect?",
         "CampusConnect is inherently relational: users own projects, projects have teams, teams have members, and teams map 1-to-1 with chat conversations. PostgreSQL provides ACID compliance, foreign key cascade constraints, and compound unique constraints ([projectId, userId]) at the storage engine level, preventing duplicate votes or applications without complex distributed locks."),
        
        ("Q2: How does JWT Refresh Token Rotation protect against replay attacks?",
         "With Token Rotation, each refresh token can only be used once. When a client requests a new access token, the server verifies the refresh token, deletes it from the database table, and issues both a new access token and a brand new refresh token. If an attacker intercepts a used token, subsequent reuse is immediately rejected, terminating the compromised session."),

        ("Q3: What is Optimistic UI and where did you implement it?",
         "Optimistic UI immediately updates the client interface before the server responds, assuming success. In CampusConnect, I implemented this on the Project Upvote button. The upvote count increments and highlights immediately. If the server request fails, the client catches the error and reverts back to the original count."),

        ("Q4: How does Socket.io differ from standard native WebSockets?",
         "Socket.io provides automatic fallback to HTTP long-polling if WebSockets are blocked by campus firewalls, heartbeat ping-pong monitoring, automatic reconnection with exponential backoff, and logical rooms (socket.join('conversation:id')) to broadcast messages exclusively to specific team participants."),

        ("Q5: How does the 2-Factor Authentication (OTP) workflow function?",
         "When a student registers or signs in, primary credentials are validated first. The server generates a cryptographically random 6-digit OTP stored with a 10-minute TTL. The client transitions to the 2FA screen. Only when the student inputs the matching code does the backend issue the final JWT access and refresh token pair."),

        ("Q6: What happens in the database when a project application is accepted?",
         "It executes an atomic orchestration: updates Application.status = 'ACCEPTED', finds or creates a Team record, assigns the owner as OWNER and applicant as MEMBER in TeamMember, auto-provisions a TEAM chat conversation, registers both participants, injects a system welcome message, and emits a real-time notification to user:${applicantId}."),

        ("Q7: How do you prevent SQL Injection and XSS attacks?",
         "SQL Injection is prevented by using Prisma ORM, which parameterizes all SQL queries automatically. XSS is mitigated by React Native, which does not execute raw HTML strings inside native views, and by validating all incoming request bodies against strict Zod schemas."),

        ("Q8: How does the mobile client handle authenticated requests?",
         "We configure an Axios HTTP client with request and response interceptors. The request interceptor attaches Authorization: Bearer <token>. The response interceptor listens for 401 Unauthorized errors, calls /api/auth/refresh-token, updates the stored token in Zustand, and retries the original request seamlessly."),

        ("Q9: How would you scale CampusConnect to 100,000 active students across 50 colleges?",
         "1. Multi-Tenancy: Add an indexed collegeId column across tables. 2. Database Scaling: Introduce PostgreSQL read replicas for read-heavy feeds. 3. WebSocket Scaling: Attach @socket.io/redis-adapter with Redis Pub/Sub to broadcast events across multiple clustered Node.js processes. 4. Caching: Place Redis in front of frequently queried project feeds. 5. CDN: Store student media in Amazon S3 with CloudFront."),

        ("Q10: What indexing strategies are used in your schema and why?",
         "Targeted B-tree indexes: @@index([ownerId]) on Project for user portfolio filtering, @@index([conversationId, createdAt]) on Message for chronological chat pagination, and @@index([userId, isRead]) on Notification to calculate unread counters in O(log N) time."),

        ("Q11: Explain how compound unique constraints solve business problems in your database.",
         "In a mobile app, users might repeatedly tap 'Upvote' or 'Apply'. By defining @@unique([projectId, userId]) on ProjectUpvote and Application, the database physically rejects duplicate records, guaranteeing idempotency at the storage engine level."),

        ("Q12: How did you design the state management in the React Native application?",
         "I used Zustand. It provides lightweight stores with minimal boilerplate: useAuthStore manages user profile, tokens, and device accounts; useSocketStore manages the persistent WebSocket connection lifecycle across screens without prop-drilling."),

        ("Q13: What HTTP status codes do your REST APIs return and why?",
         "200 OK for queries and updates, 201 Created for creating projects/applications, 400 Bad Request for Zod validation errors, 401 Unauthorized for missing/expired tokens, 403 Forbidden for unauthorized mutations, 404 Not Found for missing resources, and 500 handled by centralized error middleware."),

        ("Q14: What was the most challenging bug you encountered and how did you resolve it?",
         "During team formation on applicant acceptance, concurrent approvals could spawn duplicate team chat rooms. I resolved this by enforcing projectId String @unique on the Team model and implementing an upsert/find-or-create pattern so only one team and one group chat ever exists per project."),

        ("Q15: What are your key takeaways from building this project?",
         "Building CampusConnect taught me how to architect an end-to-end full-stack product. I gained hands-on experience in atomic relational transactions with Prisma, optimistic client-side UI updates, real-time WebSocket room broadcasting, and enterprise auth with token rotation and 2FA.")
    ]

    for q, a in qas:
        qa_data = [
            [Paragraph(f"<b>{q}</b>", qa_q_style)],
            [Paragraph(a, qa_a_style)]
        ]
        t_qa = Table(qa_data, colWidths=[523])
        t_qa.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#E2E8F0")),
            ('LINELEFT', (0,0), (0,-1), 3, primary_color),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t_qa)
        story.append(Spacer(1, 6))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: PDF generated at {pdf_path}")

if __name__ == "__main__":
    build_pdf()
