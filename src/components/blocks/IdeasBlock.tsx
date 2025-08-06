import { FC } from "react";
import { useRouter } from "next/navigation";

interface Idea {
  title: string;
  description?: string;
}

interface Props {
  ideas: Idea[];
}

const emojiList = ["🎥", "💡", "🔥", "⭐️", "📹", "🎯", "🚀", "🎬", "🎶", "🧠"];
const getEmoji = (index: number) => emojiList[index % emojiList.length];

const IdeasBlock: FC<Props> = ({ ideas }) => {
  const router = useRouter();

  if (!ideas.length) return null;

  return (
    <section className="w-full max-w-2xl mt-8 px-4">
      <h2 className="text-2xl font-semibold mb-4 text-primary">Your Video Ideas</h2>
      <div className="space-y-4">
        {ideas.map((idea, idx) => (
          <div
            key={idx}
            onClick={() => router.push(`/idea/${idx}`)}
            className="cursor-pointer bg-white rounded-2xl shadow-md p-4 border hover:shadow-lg transition"
          >
            <h3 className="text-lg font-medium text-gray-900">
               {idea.title}
            </h3>
            {idea.description && (
              <p className="text-gray-600 mt-1 text-sm">{idea.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default IdeasBlock;
