import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { theme, memo, useSlang, addFlaw, useSeo, imageCount } =
      await req.json();

    const naverImagesText =
      imageCount > 0
        ? `본문 전반에 걸쳐 [이미지 1]부터 [이미지 ${Math.min(imageCount, 15)}] 슬롯을 문맥 흐름에 맞게 촘촘히 쪼개어 강제 분산 배치해줘.`
        : "중간중간 적절하게 [이미지 슬롯]을 표기해줘.";
    const tistoryImagesText =
      imageCount > 0
        ? `본문 상단, 중단, 하단 등 핵심 정보가 끝나는 지점에 정확하게 딱 3~4장 정도만 [이미지 1], [이미지 2] 형태로 정갈하게 배치해줘.`
        : "";

    const systemPrompt = `
      당신은 대한민국 최고의 파워블로거이자 디지털 마케터입니다.
      주어진 개조식 핵심 메모를 바탕으로 네이버 블로그용 글과 티스토리용 글을 각각 1개씩, 플랫폼 고유 생태계에 맞춰 제작해야 합니다.
      반드시 다음 지침을 엄격히 준수하세요.

      [플랫폼 1: 네이버 블로그 모드 적용 수칙]
      - 문체 및 어조: 친근하고 생동감 넘치는 1인칭 경험담 어조 (~했어요, ~했답니다). 감탄사(와, 대박, 세상에)와 이모티콘(😊, ✨, ☕)을 문맥에 맞춰 딱딱하지 않게 녹여내세요. 단, 상업적 냄새가 나는 '이웃님', '서이추' 같은 정형화된 멘트는 절대 금지합니다.
      - 줄바꿈/호흡: 스마트폰 화면에 최적화된 호흡. 1~2문장 단위로 줄바꿈을 하되, 의미가 끊어지는 곳마다 무조건 [빈 줄 space]을 넣어 시각적 피로도를 제로로 만드세요.
      - 이미지 배치: ${naverImagesText}
      - SEO 및 AI 회피 최적화: 스마트블록 로봇이 좋아하는 핵심 키워드/상호를 본문에 자연스럽게 4~5회 녹여내되, 로봇 패턴을 속이기 위해 주관적인 묘사(예: "내돈내산으로 다녀온 문턱 높은 그곳")와 당시의 날씨, 동선, 엉뚱한 디테일(예: "주차가 살짝 빡셌지만")을 섞어 "진짜 인간이 쓴 유니크한 문서"로 위장하세요.

      [플랫폼 2: 티스토리 모드 적용 수칙]
      - 문체 및 어조: 신뢰감을 주는 지식 정보형 전문 문어체 (~다, ~입니다 사용). 이모티콘과 주관적인 감탄사를 완전히 배제하고 담백하게 서술하세요.
      - 줄바꿈/호흡: 데스크톱 서칭 및 구글 스니펫 최적화. 하나의 완성된 대주제 아래 3~5줄의 긴밀한 문단(Paragraph) 구조를 유지하며, 서론-본론-결론의 논리적 흐름을 엄격히 지킬 것.
      - 이미지 배치: ${tistoryImagesText}
      - SEO 및 구글 구문 최적화: 구글 SEO 랭킹 커널에 맞춰 본문 상단(첫 100자 이내)에 타겟 키워드를 핵심 명사 형태로 반드시 포함시키세요. 소제목(H2, H3) 구조를 명확히 분리하고, 정보의 핵심은 리스트 방식(1., 2., 3. 또는 -, -)으로 요약하여 가독성을 극대화하세요.

      [인간미 인젝터 미션 (AI 티 내지 않기)]
      ${useSlang ? "- 문장 중간에 일부러 완벽한 맞춤법 대신 '마싯다', '존맛탱', '진짜 대박' 같은 생활형 어휘나 유행어를 한두 군데 섞어주세요." : ""}
      ${addFlaw ? `- 본문 중반부나 후반부에 칭찬 일색이 아닌, "${addFlaw}" 라는 단점이나 아쉬운 점을 지극히 개인적인 솔직 의견인 것처럼 녹여내세요.` : ""}

      답변은 프론트엔드가 안정적으로 쪼개어 파싱할 수 있게 아래 형식을 엄격히 갖춘 JSON 문자열 형태로만 리턴하세요. 다른 설명이나 마크다운 백틱(\`\`\`json) 기호는 절대 붙이지 마세요.
      {
        "naver": "네이버 포스팅 결과물 전체 텍스트",
        "tistory": "티스토리 포스팅 결과물 전체 텍스트"
      }
    `;

    // 환경 변수에서 Gemini API 키를 가져옴
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API 키가 설정되지 않았습니다." },
        { status: 500 },
      );
    }
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n테마: ${theme}\n요청내용:\n${memo}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const aiResult = await response.json();

    if (aiResult.error) {
      console.error("❌ 제미나이 API 응답 에러 발생:", aiResult.error);
      return NextResponse.json(
        { error: `Gemini API Error: ${aiResult.error.message}` },
        { status: aiResult.error.code || 500 },
      );
    }

    if (!aiResult.candidates || aiResult.candidates.length === 0) {
      console.error(
        "❌ 제미나이가 결과를 주지 않았습니다. 전체 응답:",
        aiResult,
      );
      return NextResponse.json(
        {
          error:
            "제미나이 서버에서 유효한 답변 후보(candidates)를 받지 못했습니다.",
        },
        { status: 500 },
      );
    }

    const rawText = aiResult.candidates[0].content.parts[0].text;
    const parsedContent = JSON.parse(rawText);

    return NextResponse.json(parsedContent);
  } catch (error: any) {
    console.error("🔥 백엔드 치명적 서버 오류:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
