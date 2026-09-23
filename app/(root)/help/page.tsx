import { Metadata } from 'next';
import {
  HelpCircle,
  MessageCircle,
  BookOpen,
  Lightbulb,
  Mail,
  Github,
  ChevronDown
} from 'lucide-react';

export const metadata: Metadata = {
  title: '帮助中心 | OpenStock',
  description: 'OpenStock 的社区支持。没有付费墙，只有帮助。',
};

export default function HelpPage() {
  const faqs = [
    {
      question: "OpenStock 真的永远免费吗？",
      answer: "是的！我们依靠捐赠和社区贡献运转。核心功能（跟踪、提醒、分析）将保持免费。我们相信金融工具不应成为奢侈品。"
    },
    {
      question: "如何把股票加入自选股？",
      answer: "使用顶部或页头的搜索栏查找公司。在股票详情页，点击星形图标即可将其加入你的面板。"
    },
    {
      question: "市场数据来自哪里？",
      answer: "我们与 Finnhub 等提供商合作，提供实时与延迟数据。数据虽然可靠，但建议用于分析，而不是高频交易。"
    },
    {
      question: "我可以贡献代码或设计吗？",
      answer: "当然可以！查看我们的 GitHub 仓库。我们为初学者标注了 'good first issue' 标签。我们欢迎设计师、开发者和写作者加入。"
    },
    {
      question: "我的提醒没有触发。",
      answer: "提醒通过后台任务每 5 分钟运行一次。请确认你的账号状态正常；本地上提醒通知主要显示在应用内。"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">

      {/* Header */}
      <div className="text-center pt-16 pb-12 space-y-4">
        <div className="inline-flex p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 mb-4">
          <HelpCircle className="text-blue-400 h-8 w-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">需要什么帮助？</h1>
        <p className="text-xl text-gray-400">由社区为所有人提供的支持。</p>
      </div>

      {/* Quick Action Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-16">
        <HelpCard
          icon={<BookOpen className="text-teal-400" />}
          title="阅读文档"
          desc="深入了解功能与 API 集成。"
          link="/api-docs"
          linkText="查看文档"
        />
        <HelpCard
          icon={<MessageCircle className="text-purple-400" />}
          title="社区聊天"
          desc="从其他用户那里获得实时解答。"
          link="https://discord.gg/JkJ8kfxgxB"
          linkText="加入 Discord"
        />
        <HelpCard
          icon={<Github className="text-white" />}
          title="报告 Bug"
          desc="发现问题？告诉我们的开发者。"
          link="https://github.com/Open-Dev-Society/OpenStock/issues"
          linkText="提交 Issue"
        />
      </div>

      {/* FAQs */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-white border-b border-gray-800 pb-4">常见问题</h2>
        <div className="grid gap-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:bg-gray-800/50 transition-colors">
              <h3 className="font-semibold text-lg text-gray-200 mb-2 flex items-start gap-3">
                <Lightbulb size={20} className="text-yellow-500/50 mt-1 shrink-0" />
                {faq.question}
              </h3>
              <p className="text-gray-400 leading-relaxed ml-8 pl-1 border-l-2 border-gray-800">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Contact */}
      <div className="mt-20 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-2">还有疑问？</h3>
        <p className="text-gray-400 mb-6">我们的团队（和社区）会通过邮件答疑，通常完全免费。</p>
        <a
          href="mailto:opendevsociety@gmail.com"
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <Mail size={18} />
          联系支持
        </a>
      </div>

    </div>
  );
}

function HelpCard({ icon, title, desc, link, linkText }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex flex-col items-start hover:border-gray-700 transition-colors">
      <div className="mb-4 bg-gray-800 p-2 rounded-lg">{icon}</div>
      <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-400 mb-6 flex-grow">{desc}</p>
      <a href={link} className="text-teal-400 text-sm font-medium hover:underline flex items-center gap-1">
        {linkText} <ChevronDown size={14} className="-rotate-90" />
      </a>
    </div>
  );
}
