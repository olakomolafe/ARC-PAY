# ⚡ ARCPAY

**The Next-Generation USDC Payment Gateway for the Arc Network.**

ArcPay is a lightweight, high-performance checkout system built exclusively for the **Arc Testnet**. It enables merchants to create instant payment requests, generate shareable checkout links, and receive USDC with sub-second finality.

![ArcPay Banner](https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832&ixlib=rb-4.0.3)

## ✨ Features

- 🚀 **Arc Native**: Optimized for the Arc Testnet with sub-second transaction finality.
- 💸 **USDC First**: Native support for USDC (18-decimal gas and 6-decimal ERC-20).
- 🔗 **Shareable Links**: Generate unique payment pages for any product or service.
- 📊 **Real-time Dashboard**: Track incoming payments and customer stats in real-time.
- 🎨 **Premium UI**: Cyberpunk-inspired aesthetics with smooth glassmorphism and animations.
- 🔐 **Web3 Ready**: Built with Wagmi and RainbowKit for a seamless wallet experience.

> [!IMPORTANT]
> **Network Tip**: For the fastest transaction confirmation on Arc Testnet, it is highly recommended to manually set your **Max Fee (Gwei)** to **300** in your wallet during checkout.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS + [Framer Motion](https://www.framer.com/motion/)
- **Database/Realtime**: [Supabase](https://supabase.com/)
- **Blockchain**: [Wagmi](https://wagmi.sh/) & [Viem](https://viem.sh/)
- **Wallet Connection**: [RainbowKit](https://www.rainbowkit.com/)
- **Network**: [Arc Testnet](https://arc.network/)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/arcpay.git
cd arcpay
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server
```bash
npm run dev
```

## 🌍 Deployment

The easiest way to deploy ArcPay is via [Vercel](https://vercel.com/new).

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Add your environment variables in the project settings.
4. Update your Supabase **Authentication Redirect URLs** to include your Vercel domain.

## 📄 License

This project is licensed under the MIT License.

---

Built with ⚡ by [Your Name] for the Arc ecosystem.
