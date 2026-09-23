import { Metadata } from 'next';
import { Shield, FileText, Check, AlertTriangle, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: '服务条款 | OpenStock',
  description: '为社区制定的公平、透明、开放的条款。',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">

      {/* Hero */}
      <div className="text-center pt-16 pb-12 space-y-4">
        <div className="inline-flex p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 mb-4">
          <Scale className="text-teal-400 h-8 w-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">服务条款</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          建立在信任、透明和社区价值观之上。没有隐藏陷阱，只有清晰的规则。
        </p>
        <p className="text-sm text-gray-500">最近更新：2025 年 10 月</p>
      </div>

      <div className="space-y-12">
        {/* Core Philosophy */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Shield className="text-teal-500" />
            我们的承诺
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <PromiseItem text="核心功能永远免费。" />
            <PromiseItem text="我们绝不售卖你的个人数据。" />
            <PromiseItem text="条款变更将公开讨论。" />
            <PromiseItem text="你的自选股与分析数据归你所有。" />
          </div>
        </section>

        {/* Disclaimer */}
        <section className="bg-yellow-900/10 border border-yellow-500/20 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-yellow-500 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-xl font-bold text-yellow-100 mb-2">投资免责声明</h3>
              <p className="text-yellow-200/80 leading-relaxed">
                **OpenStock 是教育与分析工具，不是财务顾问。**
                数据按"原样"提供，仅供信息参考。切勿投入你无法承受损失的资金。
                做出任何财务决策前，请自行研究或咨询持证专业人士。
              </p>
            </div>
          </div>
        </section>

        {/* User Responsibilities */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">社区规则</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-blue-400 mb-4">✅ 应该做</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex gap-2"><Check size={16} className="text-blue-500 mt-1" /> 自由分享知识</li>
                <li className="flex gap-2"><Check size={16} className="text-blue-500 mt-1" /> 将 API 用于个人项目</li>
                <li className="flex gap-2"><Check size={16} className="text-blue-500 mt-1" /> 尊重其他成员</li>
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-red-400 mb-4">❌ 不应该做</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex gap-2"><span className="text-red-500 font-bold">×</span> 过度抓取数据</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">×</span> 分享 API 密钥</li>
                <li className="flex gap-2"><span className="text-red-500 font-bold">×</span> 用于高频交易</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-500">
            对条款有疑问？发送邮件至 <a href="mailto:opendevsociety@gmail.com" className="text-teal-400 hover:underline">opendevsociety@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function PromiseItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-800/50 p-4 rounded-lg">
      <div className="bg-teal-500/10 p-1 rounded-full">
        <Check size={14} className="text-teal-400" />
      </div>
      <span className="text-gray-300 font-medium">{text}</span>
    </div>
  );
}
