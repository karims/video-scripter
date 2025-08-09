import { FC } from "react";
import { useRouter } from "next/navigation";

interface Idea {
  title: string;
  description?: string;
}

interface Props {
  ideas: Idea[];
  query: string;
}

const IdeasBlock: FC<Props> = ({ ideas, query }) => {
  const router = useRouter();

  if (!ideas.length) return null;

  const cleanQuery = query.length > 100 ? query.slice(0, 97) + "..." : query;

  return (
    <section className="w-full max-w-2xl mt-8 px-4">
      <h2 className="text-2xl font-semibold text-primary">Your Video Ideas</h2>
      <p className="text-sm italic text-gray-600 mt-1 mb-6">for: “{cleanQuery}”</p>

      <div className="divide-y divide-gray-200">
        {ideas.map((idea, idx) => (
          <div
            key={idx}
            onClick={() => router.push(`/idea/${idx}`)}
            className="py-5 cursor-pointer group transition-all"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-black group-hover:underline underline-offset-4 decoration-primary transition">
                {idx + 1}. {idea.title}
              </h3>
            </div>
            {idea.description && (
              <p className="text-gray-500 mt-1 text-sm leading-relaxed group-hover:text-gray-700 transition">
                {idea.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default IdeasBlock;
