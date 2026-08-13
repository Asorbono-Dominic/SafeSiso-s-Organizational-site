export type ConversationTurn = {
  from: string;
  text: string;
};

/**
 * Smartphone mockup showing a sample SafeSiso conversation.
 *
 * The conversation is invented, on-brand copy. It must NEVER be a real girl's
 * chat (Spec 6.1), and the caption says so on the page rather than only in a
 * code comment.
 */
export function PhoneConversation({
  turns,
  label,
  disclaimer,
}: {
  turns: readonly ConversationTurn[];
  label: string;
  disclaimer: string;
}) {
  return (
    <figure className="mx-auto w-full max-w-[20rem]">
      <div className="rounded-[2rem] border-8 border-teal-900 bg-teal-900 shadow-xl">
        <div className="rounded-[1.5rem] bg-[#ECE5DD] px-3 py-4">
          <p className="sr-only">{label}</p>
          <ul className="space-y-2.5">
            {turns.map((turn, index) => {
              const isGirl = turn.from === "girl";
              return (
                <li
                  key={index}
                  className={isGirl ? "flex justify-end" : "flex justify-start"}
                >
                  <span
                    className={
                      isGirl
                        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-[#DCF8C6] px-3 py-2 text-sm leading-snug text-teal-900"
                        : "max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm leading-snug text-teal-900"
                    }
                  >
                    {turn.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-teal-700">
        {disclaimer}
      </figcaption>
    </figure>
  );
}
