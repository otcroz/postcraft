"use client";

import { useState, useEffect } from "react";

export default function MainDashboard() {
  const [theme, setTheme] = useState("cafe");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [useSlang, setUseSlang] = useState(false);
  const [addFlaw, setAddFlaw] = useState(false);
  const [flawText, setFlawText] = useState("");
  const [useSeo, setUseSeo] = useState(true);
  
  const [keywords, setKeywords] = useState<{keyword: string, volume: string, outline: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"naver" | "tistory">("naver");
  const [copied, setCopied] = useState(false);
  
  const [result, setResult] = useState({ naver: "", tistory: "" });

  useEffect(() => {
    fetch("/api/keywords?theme=" + theme)
      .then((res) => res.json())
      .then((data) => setKeywords(data.keywords || []));
  }, [theme]);

  const applyOutline = (outline: string, keyword: string) => {
    setMemo(`[추천 키워드: ${keyword}]\n\n${outline}\n\n[나의 실제 경험 메모]: `);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      if (images.length + fileList.length > 20) {
        alert("사진은 최대 20장까지 업로드 가능합니다.");
        return;
      }
      setImages([...images, ...fileList]);
      const previews = fileList.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...previews]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      // 클립보드에 있는 데이터 중 '이미지' 파일이 있는지 확인
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile(); // 이미지 데이터를 File 객체로 추출
        
        if (file) {
          // 1. 실제 업로드할 파일 배열에 자동으로 추가
          setImages((prev) => [...prev, file]);
          
          // 2. 화면에 바로 띄우기 위해 프리뷰(Base64) 경로 생성 및 자동 추가
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setImagePreviews((prev) => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
          
          // 이미지를 붙여넣었으므로, 텍스트창에 'image' 문자열 등이 찍히는 기본 동작 방지
          e.preventDefault(); 
        }
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleGenerate = async () => {
    if (!memo.trim()) return alert("메모 내용을 입력해 주세요.");
    setLoading(true);
    
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme,
          memo,
          useSlang,
          addFlaw: addFlaw ? flawText : null,
          useSeo,
          imageCount: images.length
        }),
      });
      const data = await response.json();
      setResult({ naver: data.naver, tistory: data.tistory });
    } catch (error) {
      console.error(error);
      alert("글 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (type: "naver" | "tistory") => {
    const textToCopy = type === "naver" ? result.naver : result.tistory;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("복사에 실패했습니다.");
    }
  };

  return (
    // 🎨 [개선 3] 배경 색깔 애니메이션: 완전한 블랙이 아닌 미드나잇 사이언 그린과 딥 펄 시안이 스무스하게 회전하는 어두운 무빙 그라데이션
    <div className="min-h-screen bg-gradient-to-br from-[#050b0d] via-[#09070f] to-[#04080a] bg-[length:400%_400%] animate-[bgMovement_16s_ease_infinite] text-zinc-100 p-4 md:p-8 font-sans antialiased">
      
      {/* 초고도화 UI 무드 전용 내장 키프레임 스타일링 정의 */}
      <style jsx global>{`
        @keyframes bgMovement {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes colorShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-btn-color {
          background-size: 200% 200%;
          animation: colorShift 5s ease infinite;
        }
      `}</style>
      
      <header className="max-w-7xl mx-auto mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800/60 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              PostCraft
            </h1>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">v1.2 Live</span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">사진과 메모 조각으로 빚어내는 AI 블로그 아키텍처</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 왼쪽 사이드 컨트롤러 */}
        <div className="lg:col-span-5 space-y-6 bg-zinc-900/30 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800/80 shadow-2xl">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              1. 콘텐츠 테마 선택
            </label>
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 transition-all focus:outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 cursor-pointer"
            >
              <option value="cafe">☕ 카페 / 디저트 맛집</option>
              <option value="study">📖 카공 / 서재 / 공부방</option>
              <option value="travel">✈️ 국내외 여행 / 호캉스</option>
              <option value="exhibition">🎨 문화생활 / 전시회 / 팝업스토어</option>
            </select>
          </div>

          {/* 🎨 [개선 1] 키워드 태그 인터랙티브 효과: 마우스 호버 시 글로우 네온 테두리와 은은한 발광 광채 생성 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              💡 오늘의 급상승 틈새 키워드
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {keywords.map((kw, idx) => (
                <button
                  key={idx}
                  onClick={() => applyOutline(kw.outline, kw.keyword)}
                  className="group relative overflow-hidden bg-zinc-950/40 border border-zinc-800/80 hover:border-emerald-500/60 text-left px-3.5 py-2 rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-md hover:shadow-emerald-500/10"
                >
                  {/* 태그 호버 인터랙션용 배경 레이어 */}
                  <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="text-xs font-medium block text-zinc-400 group-hover:text-emerald-300 transition-colors duration-200">
                    🔥 {kw.keyword}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 block mt-0.5 group-hover:text-emerald-400/70 transition-colors duration-200">
                    {kw.volume}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              2. 사진 첨부 및 빌드 순서 ({images.length}/20)
            </label>
            <div className="group relative border-2 border-dashed border-zinc-800 hover:border-emerald-500/60 rounded-xl p-5 text-center cursor-pointer transition-all duration-300 bg-zinc-950/30 hover:bg-emerald-500/[0.02]">
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors pointer-events-none">
                클릭하거나 이미지를 드래그하여 드롭하세요.
              </div>
            </div>

            {/* 이미지 썸네일 그리드 */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2.5 bg-zinc-950/90 p-3 rounded-xl border border-zinc-800/80 mt-3 max-h-[150px] overflow-y-auto">
                {imagePreviews.map((url, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-800 transition-transform duration-200 hover:scale-[1.05]">
                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-zinc-950/80 backdrop-blur-md text-[9px] font-bold text-emerald-400 px-1.5 py-0.5 rounded border border-zinc-800">
                      #{index + 1}
                    </span>
                    <button 
                      onClick={() => removeImage(index)}
                      className="absolute inset-0 bg-red-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] text-red-300 font-bold transition-all duration-200"
                    >
                      제거
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              3. 핵심 팩트 입력 (개조식 메모)
            </label>
            <textarea
              rows={5}
              value={memo}
              onPaste={handlePaste}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="위 키워드를 선택하시면 AI 포스팅 최적화 가이드가 자동으로 세팅됩니다. 여기에 본인만의 구체적인 사실 조각을 추가해 보세요!"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3.5 text-zinc-200 text-sm placeholder-zinc-600 transition-all focus:outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 resize-y min-h-[120px]"
            />
          </div>

          <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">⚙️ 인간미 주입 및 알고리즘 세팅</h3>
            
            <label className="flex items-center justify-between cursor-pointer group p-1">
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">자연스러운 생활 오타 및 최신 유행어 슬쩍 섞기</span>
              <input type="checkbox" checked={useSlang} onChange={(e) => setUseSlang(e.target.checked)} className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 accent-emerald-500 cursor-pointer" />
            </label>

            <div className="pt-">
              <label className="flex items-center justify-between cursor-pointer group p-1 mb-2">
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">솔직한 주관적 단점/아쉬운 점 레이어 추가</span>
                <input type="checkbox" checked={addFlaw} onChange={(e) => setAddFlaw(e.target.checked)} className="w-4 h-4 rounded text-emerald-500 bg-zinc-900 border-zinc-700 accent-emerald-500 cursor-pointer" />
              </label>
              {addFlaw && (
                <input type="text" value={flawText} onChange={(e) => setFlawText(e.target.value)} placeholder="예시: 주차공간 좁음" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50" />
              )}
            </div>
          </div>

          {/* 🎨 [개선 2] 생성 버튼 애니메이션 색깔 효과: 에메랄드 그린에서 마린 블루, 딥 일렉트릭 퍼플로 유동적으로 일렁이는 흐름 그래디언트 */}
          <button 
            onClick={handleGenerate} 
            disabled={loading} 
            className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-600 disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 font-extrabold p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 shadow-xl hover:shadow-emerald-500/10 animate-gradient-flow animate-btn-color"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <span className="relative z-10 text-sm tracking-wide block">
              {loading ? "인간의 언어로 조율 중..." : "블로그 포스팅 원터치 생성하기 ✨"}
            </span>
          </button>
        </div>

        {/* 오른쪽 텍스트 편집 보드 */}
        <div className="lg:col-span-7 flex flex-col bg-zinc-900/20 backdrop-blur-xl rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden min-h-[620px]">
          
          <div className="flex border-b border-zinc-800/60 bg-zinc-950/80 p-2 gap-1">
            <button onClick={() => setActiveTab("naver")} className={`flex-1 flex items-center justify-center gap-2 p-3 text-xs font-bold tracking-wider rounded-xl transition-all duration-300 ${activeTab === "naver" ? "text-emerald-400 bg-zinc-900/80 border border-zinc-800/80 shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}>
              🟢 네이버 블로그 모드 원고
            </button>
            <button onClick={() => setActiveTab("tistory")} className={`flex-1 flex items-center justify-center gap-2 p-3 text-xs font-bold tracking-wider rounded-xl transition-all duration-300 ${activeTab === "tistory" ? "text-amber-400 bg-zinc-900/80 border border-zinc-800/80 shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}>
              🍊 티스토리 모드 원고
            </button>
          </div>

          <div className="flex-1 p-5 flex flex-col relative bg-zinc-950/10">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-30">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-800 border-b-emerald-400 mb-3"></div>
                <p className="text-xs text-zinc-400">원고를 고도화하고 있습니다...</p>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono tracking-wide text-zinc-500 uppercase bg-zinc-900/60 border border-zinc-800 px-2 py-0.5 rounded">
                Live Editor Mode
              </span>
              <span className="text-[11px] text-zinc-400">대시보드 안에서 원고를 자유롭게 직접 수정할 수 있습니다.</span>
            </div>

            <textarea
              value={activeTab === "naver" ? result.naver : result.tistory}
              onChange={(e) => {
                if (activeTab === "naver") setResult({ ...result, naver: e.target.value });
                else setResult({ ...result, tistory: e.target.value });
              }}
              placeholder="생성된 원고가 출력됩니다. 자유롭게 수정한 뒤 복사하세요!"
              className="w-full flex-1 bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 text-zinc-300 text-sm font-mono leading-relaxed resize-none focus:outline-none focus:border-zinc-700 focus:ring-4 focus:ring-zinc-500/5"
            />

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] text-zinc-500">본문을 드래그하거나 수정 후 아래 복사 버튼을 눌러 바로 발행하세요.</p>
              <button 
                onClick={() => copyToClipboard(activeTab)} 
                disabled={!(activeTab === "naver" ? result.naver : result.tistory)} 
                className={`text-xs font-bold px-5 py-2.5 rounded-xl transition-all duration-300 transform active:scale-95 border ${copied ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40" : "bg-zinc-100 text-zinc-950 hover:bg-zinc-200 border-transparent disabled:bg-zinc-800 disabled:text-zinc-600"}`}
              >
                {copied ? "✓ 본문 클립보드 복사하기" : "📋 본문 클립보드 복사하기"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}