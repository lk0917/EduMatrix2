const OpenAI = require("openai");
const dotenv = require("dotenv");

// .env 파일에서 환경 변수 로드
dotenv.config({
  path: ".env",
});

const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Assistant ID 설정
const assistantId = process.env.ASSISTANT_ID; // 실제 Assistant ID로 대체하세요.

async function handleChat(req, res) {
  try {
    const userQuestion = req.body.message;
    let threadId = req.body.thread_id;

    if (!threadId) {
      // 새로운 스레드 생성
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    // 메시지 생성
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: userQuestion,
    });

    // Assistant 실행 및 polling
    const run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    });

    // run.status가 completed인지 확인
    if (run.status !== "completed") {
      return res
        .status(500)
        .json({ error: "Assistant 실행 실패", status: run.status });
    }

    // 마지막 Assistant 메시지 가져오기
    const messages = await openai.beta.threads.messages.list(threadId);

    const lastMessageForRun = messages.data
      .filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    if (lastMessageForRun) {
      const assistantResponseText = lastMessageForRun.content[0].text.value;
      return res.send({
        response: assistantResponseText,
        thread_id: threadId,
      });
    } else {
      return res.status(500).json({ error: "Assistant가 응답을 제공하지 않았습니다." });
    }
  } catch (error) {
    console.error("챗봇 오류:", error);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
}

module.exports = {
  handleChat,
};
