# Partners Unlimited — New Website

A modern 2026 SaaS-style redesign of the Partners Unlimited website, built as a **static site** ready to host on GitHub Pages. No build tools, no dependencies — pure HTML, CSS and JavaScript.

## Files
```
new-site/
├── index.html        # Homepage (hero, features, values, CTA)
├── about.html        # About Us — who we are, core values, objectives
├── membership.html   # Membership tiers, dues, terms, application
├── evaluation.html   # Annual Evaluation, Ethics, Debt Protection
├── operate.html      # 4 regions, governance, disqualification
├── meetings.html     # AGM & GSM
├── contact.html      # Contact info + enquiry form
├── assets/
│   ├── styles.css    # Design system
│   └── app.js        # Nav + scroll-reveal
└── README.md
```

## Host on GitHub Pages

1. Create a new GitHub repository (e.g. `partnersunlimited`).
2. Upload **everything inside the `new-site/` folder** to the repo root — i.e. `index.html`, the other `.html` files, and the `assets/` folder must all sit at the top level of the repo.
3. On GitHub, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, select **Deploy from a branch**.
5. Choose the **`main`** branch and **`/ (root)`** folder, then **Save**.
6. Wait ~1 minute. Your site will be live at:
   `https://<your-username>.github.io/<repo-name>/`

> 💡 **For a custom domain** (e.g. partnersunlimited.net): add a `CNAME` file at the repo root containing `partnersunlimited.net`, then point your domain's DNS at GitHub Pages.

## Editing
- All content is plain HTML — open any `.html` file and edit the text directly.
- Colors/fonts/spacing are controlled by CSS variables at the top of `assets/styles.css`.
- The contact form is a static demo. To receive real submissions, point it at a free service like [Formspree](https://formspree.io) or [Web3Forms](https://web3forms.com) — change the `<form action="...">` accordingly.

## Notes
- Content, branding, contact details and theme are carried over from the original Partners Unlimited site and refreshed into a modern design.
- The "Member Area" button links to the existing members portal (members.partnersunlimited.net).
