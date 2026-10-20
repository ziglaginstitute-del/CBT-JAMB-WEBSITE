# PrepCBT - JAMB UTME & WASSCE Standard CBT Mock Exam Portal

PrepCBT is a Computer-Based Testing (CBT) web application built for Nigerian students preparing for **JAMB UTME** and **WASSCE (WAEC)** examinations.

Designed with a high-contrast **Sky Blue (`#0284C7`), Slate Black (`#0F172A`), and Crisp White (`#FFFFFF`)** design system.

---

## 🌟 Key Features

1. **Untimed Subject Practice Mode**:
   - Practice individual subjects (English, Mathematics, Physics, Chemistry, Biology, Economics, Government, Literature, Accounting, Commerce).
   - Filter questions by difficulty: **Beginner**, **Intermediate**, and **Advanced**.
   - Immediate answer checking, hints, and step-by-step solution explanations.

2. **Standard 4-Subject Timed CBT Mock Exam Mode**:
   - Real exam conditions matching official JAMB UTME and WASSCE interfaces.
   - Choose up to 4 subjects (e.g. Use of English + 3 chosen electives).
   - Live countdown timer with visual warning shifts (< 15 mins amber, < 5 mins pulsing red).
   - Embedded digital **JAMB Calculator**.
   - Keyboard shortcuts (`A, B, C, D` to select options, `N` for Next, `P` for Previous, `R` to Flag/Review, `S` to Submit).
   - Question Navigator Palette Grid with color indicators (Sky Blue = Answered, Slate = Skipped, Amber = Flagged).
   - Automated auto-submission when exam time elapses.

3. **Performance & Score Analytics**:
   - Official JAMB score calculation out of 400.
   - WASSCE grade assignment (A1, B2, B3, C4, C5, C6, D7, E8, F9).
   - Subject-by-subject accuracy breakdown.
   - Detailed solution review for all attempted and skipped questions.

---

## 🚀 How to Run Locally

1. Open your terminal in this project directory:
   ```bash
   cd cbt-mock-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🌐 Deploying to the Internet

### Option A: Vercel (Recommended - Free 1-Click Deploy)
1. Install Vercel CLI or connect your GitHub repository to [Vercel](https://vercel.com).
2. The included `vercel.json` file will automatically handle SPA routing rewrites.
3. Command to deploy via Vercel CLI:
   ```bash
   npm i -g vercel
   vercel
   ```

### Option B: Netlify
1. Connect your repository to [Netlify](https://netlify.com).
2. The included `netlify.toml` automatically sets build command to `npm run build` and publish directory to `dist`.

### Option C: Docker Container
1. Build the Docker image:
   ```bash
   docker build -t prepcbt-app .
   ```
2. Run the container on port 80:
   ```bash
   docker run -d -p 80:80 prepcbt-app
   ```

### Option D: GitHub Pages / Static Hosting
1. Run `npm run build` locally.
2. Deploy the contents of the `dist/` directory to any static file server or hosting provider.
