import { Card, CardContent } from '@/components/ui/card'
import { Rocket, Terminal, Cloud, Cpu, Code } from 'lucide-react'

export default function Home() {
  const topics = [
    { name: 'AWS', icon: <Cloud className="w-6 h-6 text-blue-500" />, emoji: '☁️' },
    { name: 'Docker', icon: <Cpu className="w-6 h-6 text-blue-600" />, emoji: '🐳' },
    { name: 'Git', icon: <Code className="w-6 h-6 text-orange-500" />, emoji: '🔀' },
    { name: 'Kubernetes', icon: <Terminal className="w-6 h-6 text-purple-500" />, emoji: '☸️' },
    { name: 'Linux', icon: <Rocket className="w-6 h-6 text-green-500" />, emoji: '🐧' },
    { name: 'Nginx', icon: <Rocket className="w-6 h-6 text-gray-500" />, emoji: '🚪' },
    { name: 'Node.js', icon: <Code className="w-6 h-6 text-green-600" />, emoji: '🟢' },
    { name: 'PostgreSQL', icon: <Code className="w-6 h-6 text-blue-700" />, emoji: '🗄️' },
    { name: 'Python', icon: <Code className="w-6 h-6 text-yellow-500" />, emoji: '🐍' },
    { name: 'Terraform', icon: <Code className="w-6 h-6 text-indigo-500" />, emoji: '🌍' },
  ]

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6 md:px-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-2">
          <Rocket className="w-10 h-10 text-red-500" /> DevOps Documentation & Notes
        </h1>
        <p className="text-lg text-gray-600 italic">
          Your personal knowledge base for mastering modern DevOps tools and workflows.
        </p>
      </header>

      <section className="mb-12">
        <p className="text-gray-700 max-w-3xl mx-auto text-center">
          Welcome to my DevOps brain dump – a curated hub of notes, guides, and insights from my
          real-world experience as a DevOps engineer. Whether you're just starting out or looking
          to refine your expertise, you'll find resources here to accelerate your learning.
        </p>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6 text-center">🧭 Explore Key Topics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {topics.map((topic) => (
            <Card
              key={topic.name}
              className="hover:shadow-xl transition-shadow duration-300"
            >
              <CardContent className="flex items-center gap-4">
                <div className="text-2xl">{topic.emoji}</div>
                <div>
                  <h3 className="text-lg font-semibold">{topic.name}</h3>
                  <div className="text-gray-400">{topic.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          Built with ❤️ by Vatan, for DevOps enthusiasts.
        </p>
      </section>
    </main>
  )
}
