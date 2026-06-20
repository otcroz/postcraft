import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { theme, memo, useSlang, addFlaw, useSeo, imageCount } = await req.json();

    const naverImagesText = imageCount > 0 ? `본문 전반에 걸쳐 [이미지 1]부터 [이미지 ${Math.min(imageCount, 15)}] 슬롯을 문맥 흐름에 맞게 촘촘히 쪼개어 강제 분산 배치해줘.` : "중간중간 적절하게 [이미지 슬롯]을 표기해줘.";
    const tistoryImagesText = imageCount > 0 ? `본문 상단, 중단, 하단 등 핵심 정보가 끝나는 지점에 정확하게 딱 3~4장 정도만 [이미지 1], [이미지 2] 형태로 정갈하게 배치해줘.` : "";

    const systemPrompt = `
      당신은 대한민국 최고의 파워블로거이자 디지털 마케터입니다.
      주어진 개조식 핵심 메모를 바탕으로 네이버 블로그용 글과 티스토리용 글을 각각 1개씩, 플랫폼 고유 생태계에 맞춰 제작해야 합니다.
      반드시 다음 지침을 엄격히 준수하세요.

      [플랫폼 1: 네이버 블로그 모드 적용 수칙]
      - 문체 및 어조: 친근한 이웃 대화체 (~했어요, ~했답니다, 😊, ✨ 같은 적절한 이모티콘 적극 활용)
      - 줄바꿈/호흡: 모바일 가독성에 올인할 것. 한 문장이 끝나거나 2~3줄 단위로 무조건 빈 줄바꿈 처리를 하여 시원하게 읽히도록 구성할 것.
      - 이미지 배치: ${naverImagesText}
      - SEO 최적화: 유저가 준 키워드나 핵심 상호를 제목과 본문 맥락 속에 인위적이지 않고 자연스럽게 수차례 반복 변형 노출하여 스마트블록 로봇이 인식하게 할 것.

      [플랫폼 2: 티스토리 모드 적용 수칙]
      - 문체 및 어조: 객관적이고 이성적인 전문 문어체 (~다, ~입니다 사용, 이모티콘 완전히 배제)
      - 줄바꿈/호흡: PC 및 태블릿 정보 서칭에 최적화된 서술형 줄글 형태. 긴 호흡의 긴밀한 문단형 구조를 지킬 것.
      - 이미지 배치: ${tistoryImagesText}
      - SEO 최적화: 구글 SEO 봇이 읽을 수 있도록 명확한 H2, H3 마크다운 태그 기법으로 구조화하고, 글 맨 아래에 검색 결과 노출용 한 줄 요약 메타 디스크립션(Meta Description)을 강제로 생성해줄 것.

      [인간미 인젝터 미션 (AI 티 내지 않기)]
      ${useSlang ? "- 문장 중간에 일부러 완벽한 맞춤법 대신 '마싯음', '존맛탱', '진짜 대박임' 같은 생활형 어휘나 최신 유행어를 한두 군데 섞어주세요." : ""}
      ${addFlaw ? `- 본문 중반부나 후반부에 칭찬 일색이 아닌, "${addFlaw}" 라는 단점이나 아쉬운 점을 지극히 개인적인 솔직 의견인 것처럼 녹여내세요.` : ""}

      답변은 프론트엔드가 안정적으로 쪼개어 파싱할 수 있게 아래 형식을 엄격히 갖춘 JSON 문자열 형태로만 리턴하세요. 다른 설명이나 마크다운 백틱(\`\`\`json) 기호는 절대 붙이지 마세요.
      {
        "naver": "네이버 포스팅 결과물 전체 텍스트",
        "tistory": "티스토리 포스팅 결과물 전체 텍스트"
      }
    `;

    // 💡 [수정 완료] 환경 변수 체크를 제거하고, 이전에 작동하던 제미나이 API 키를 코드에 직접 박았습니다.
    const GEMINI_API_KEY = "AIzaSyAEN51N4rlvI303kzw53djgbEgpw4at7fI";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n테마: ${theme}\n요청내용:\n${memo}`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
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
        { status: aiResult.error.code || 500 }
      );
    }

    if (!aiResult.candidates || aiResult.candidates.length === 0) {
      console.error("❌ 제미나이가 결과를 주지 않았습니다. 전체 응답:", aiResult);
      return NextResponse.json(
        { error: "제미나이 서버에서 유효한 답변 후보(candidates)를 받지 못했습니다." }, 
        { status: 500 }
      );
    }

    const rawText = aiResult.candidates[0].content.parts[0].text;
    const parsedContent = JSON.parse(rawText);

    return NextResponse.json(parsedContent);
  } catch (error: any) {
    console.error("🔥 백엔드 치명적 서버 오류:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}