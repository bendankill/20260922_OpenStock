
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Server,
  Cpu,
  ShieldCheck,
  Clock,
  Database,
  Mail,
  BarChart2,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const metadata = {
  title: 'API 与架构 | OpenStock',
  description: 'OpenStock 架构、AI 集成与后台任务的技术文档。',
};

export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-20">
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-10">
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700 shadow-xl">
            <img src="/assets/images/logo.png" alt="openstock" className="h-10 w-auto invert brightness-0" />
          </div>
          <span className="text-gray-600 text-2xl">+</span>
          <div className="bg-gray-800 p-3 rounded-2xl border border-gray-700 shadow-xl">
            <img src="/assets/icons/siray.svg" alt="Siray" className="h-10 w-auto invert brightness-0" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          OpenStock 架构
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          透明地了解驱动你市场洞察的事件驱动、多提供商系统。
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Badge color="green">v1.0.0 运行中</Badge>
          <Badge color="purple">Gemini + Siray AI</Badge>
          <Badge color="blue">开源 AGPL-3.0</Badge>
        </div>
      </section>

      {/* AI Architecture Section */}
      <section className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Cpu className="text-teal-400 h-8 w-8" />
            <h2 className="text-3xl font-bold text-gray-100">智能 UI</h2>
          </div>
          <p className="text-gray-400 leading-relaxed">
            我们通过稳健的多提供商策略，优先保障生成式功能（欢迎邮件、新闻摘要）的可用性。
            系统会自动绕过故障路由。
          </p>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-teal-500/10 p-2 rounded-lg text-teal-400">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  首选：Google Gemini
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20">Flash Lite 2.5</span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  处理新闻摘要与个性化的大批量推理。
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-700 w-full" />

            <div className="flex items-start gap-4">
              <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  备选：Siray.ai
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">Ultra 1.0</span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  即时故障转移保护。若 Gemini 不稳定，Siray 立即接管，确保零丢失请求。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Diagram / Visual */}
        <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-8 flex flex-col justify-center items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Visual Flowchart */}
          <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">
            <div className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm border border-gray-700 w-full text-center">
              用户操作 / 定时任务
            </div>
            <div className="h-6 w-px bg-gray-700" />
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-600 w-full flex flex-col gap-3 relative shadow-2xl">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-12 bg-teal-500 rounded-full" />
              <span className="text-xs font-mono text-teal-500 mb-1">Inngest Function</span>
              <div className="flex items-center justify-between text-sm text-gray-200 bg-black/40 p-2 rounded border border-gray-700">
                <span>尝试 Gemini</span>
                <CheckCircle2 size={14} className="text-teal-500" />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-200 bg-blue-900/20 p-2 rounded border border-blue-800/50">
                <span className="flex items-center gap-2">
                  回退到 Siray
                  <ShieldCheck size={12} className="text-blue-400" />
                </span>
                <ArrowRight size={14} className="text-blue-400" />
              </div>
            </div>
            <div className="h-6 w-px bg-gray-700" />
            <div className="bg-green-900/20 text-green-400 px-4 py-2 rounded-lg text-sm border border-green-900/50 w-full text-center font-medium">
              内容已送达
            </div>
          </div>
        </div>
      </section>

      {/* Background Jobs */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Server className="text-purple-400 h-8 w-8" />
          <h2 className="text-3xl font-bold text-gray-100">Serverless 基础设施</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <JobCard
            icon={<Mail size={20} />}
            title="注册邮件"
            trigger="事件触发"
            desc="通过 AI 生成个性化欢迎/引导邮件。"
            color="purple"
          />
          <JobCard
            icon={<BarChart2 size={20} />}
            title="每周新闻"
            trigger="定时：周一 9 点"
            desc="总结市场新闻并通过 ConvertKit 广播。"
            color="teal"
          />
          <JobCard
            icon={<Clock size={20} />}
            title="股票提醒"
            trigger="定时：每 5 分钟"
            desc="对照实时数据检查用户目标价。"
            color="yellow"
          />
          <JobCard
            icon={<AlertTriangle size={20} />}
            title="用户召回"
            trigger="定时：每天"
            desc="识别沉默用户并发送提醒。"
            color="red"
          />
        </div>
      </section>

      {/* Integration Stack */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Database className="text-blue-400 h-8 w-8" />
          <h2 className="text-3xl font-bold text-gray-100">技术栈与数据</h2>
        </div>

        <div className="grid gap-4">
          <StackItem
            title="Finnhub"
            desc="实时行情、技术指标与市场新闻。"
            url="https://finnhub.io"
          />
          <StackItem
            title="ConvertKit (Kit)"
            desc="大批量新闻通讯广播与用户标签。"
            url="https://kit.com"
          />
          <StackItem
            title="MongoDB Atlas"
            desc="基于 AWS 的分布式数据。绕过 SRV 的连接实现最大可靠性。"
            url="https://mongodb.com"
          />
        </div>
      </section>

    </div>
  );
}

// Helper Components

function Badge({ children, color }: { children: React.ReactNode, color: 'green' | 'purple' | 'blue' }) {
  const colors = {
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
}

function JobCard({ icon, title, trigger, desc, color }: any) {
  const colorClasses: any = {
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20 hover:border-teal-500/40',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40',
    red: 'text-red-400 bg-red-500/10 border-red-500/20 hover:border-red-500/40',
  };

  return (
    <div className={`p-5 rounded-xl border transition-all duration-300 ${colorClasses[color]}`}>
      <div className="mb-4">{icon}</div>
      <h3 className="font-bold text-gray-100 text-lg mb-1">{title}</h3>
      <div className="text-xs font-mono opacity-70 mb-3 uppercase tracking-wider">{trigger}</div>
      <p className="text-sm opacity-80 leading-relaxed">{desc}</p>
    </div>
  );
}

function StackItem({ title, desc, url }: any) {
  return (
    <Link href={url} target="_blank" className="block group">
      <div className="bg-gray-800/40 hover:bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-200 group-hover:text-teal-400 transition-colors">{title}</h3>
          <p className="text-gray-500 mt-1">{desc}</p>
        </div>
        <ArrowRight className="text-gray-600 group-hover:text-teal-400 transition-colors" />
      </div>
    </Link>
  );
}
