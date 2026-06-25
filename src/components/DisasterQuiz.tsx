import React, { useState } from "react";
import { BookOpen, CheckSquare, Award, ArrowRight, Sparkles, HelpCircle } from "lucide-react";

export interface Question {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
}

export const PRE_TEST_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Apa tindakan pertama raga kita saat merasakan guncangan gempa ketika sedang berada di dalam kelas?",
    options: [
      { key: "A", text: "A. Berlari secepat mungkin menuruni tangga bersama-sama" },
      { key: "B", text: "B. Segera berlindung di bawah meja yang kokoh dan melindungi kepala" },
      { key: "C", text: "C. Berdiam diri di dekat jendela kaca untuk melihat kondisi luar" },
      { key: "D", text: "D. Menangis dan berteriak sekeras-kerasnya meminta pertolongan" }
    ],
    correctAnswer: "B"
  },
  {
    id: 2,
    question: "Manakah salah satu tindakan pencegahan banjir yang paling mudah dilakukan siswa di lingkungan sekolah?",
    options: [
      { key: "A", text: "A. Menanam pohon besar di dalam ruang kelas" },
      { key: "B", text: "B. Membuang sampah botol plastik ke tempat sampah, bukan ke selokan" },
      { key: "C", text: "C. Menutup semua saluran drainase dengan semen beton tebal" },
      { key: "D", text: "D. Membangun bendungan air besar di depan gerbang sekolah" }
    ],
    correctAnswer: "B"
  },
  {
    id: 3,
    question: "Saat gunung berapi berada dalam status \"AWAS\", tindakan mitigasi apa yang paling tepat dilakukan warga sekitar?",
    options: [
      { key: "A", text: "A. Naik ke puncak gunung untuk berfoto dengan kawah aktif" },
      { key: "B", text: "B. Tetap tinggal di rumah dan menutup semua pintu rapat-rapat" },
      { key: "C", text: "C. Segera mengungsi ke posko darurat atau tempat aman yang berada di luar zona bahaya" },
      { key: "D", text: "D. Membuka lahan perkebunan baru di lereng gunung" }
    ],
    correctAnswer: "C"
  },
  {
    id: 4,
    question: "Setelah gempa bumi besar terjadi di dekat pantai, kamu melihat air laut tiba-tiba surut drastis hingga ikan-ikan terlihat di pasir pantai. Apa tindakan terbaikmu?",
    options: [
      { key: "A", text: "A. Masuk ke pantai untuk mengambil ikan-ikan yang terdampar" },
      { key: "B", text: "B. Segera berlari sejauh mungkin menuju tempat yang tinggi dan aman" },
      { key: "C", text: "C. Duduk santai di tepi pantai menunggu gelombang datang" },
      { key: "D", text: "D. Menelepon teman untuk datang menyaksikan air surut bersama" }
    ],
    correctAnswer: "B"
  },
  {
    id: 5,
    question: "Barang darurat berikut ini yang paling penting dimasukkan ke dalam Tas Siaga Bencana (TSB) keluarga adalah...",
    options: [
      { key: "A", text: "A. Konsol game portabel, mainan kesukaan, dan buku komik" },
      { key: "B", text: "B. Air minum kemasan, makanan instan, obat-obatan, senter, dan peluit" },
      { key: "C", text: "C. Pakaian pesta, perhiasan emas, dan cermin besar" },
      { key: "D", text: "D. Sepatu olahraga baru, raket bulutangkis, dan topi santai" }
    ],
    correctAnswer: "B"
  }
];

export const POST_TEST_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Saat berada di dalam gedung bertingkat tinggi dan gempa bumi terjadi, mengapa kita sebaiknya TIDAK menggunakan lift untuk turun?",
    options: [
      { key: "A", text: "A. Lift membutuhkan waktu terlalu lama untuk menutup pintunya" },
      { key: "B", text: "B. Khawatir lift akan mati listrik secara mendadak sehingga kita terjebak di dalamnya" },
      { key: "C", text: "C. Lift hanya boleh digunakan oleh guru dan juri saja" },
      { key: "D", text: "D. Lift bergerak terlalu cepat dan bisa membuat pusing kepala" }
    ],
    correctAnswer: "B"
  },
  {
    id: 2,
    question: "Saat banjir mulai menggenangi jalan raya dan halaman rumah, mengapa kita dilarang bermain air atau berenang di air banjir?",
    options: [
      { key: "A", text: "A. Air banjir sangat dingin dan bisa membuat mengantuk" },
      { key: "B", text: "B. Air banjir kotor, rawan membawa kuman penyakit, sampah tajam, atau arus yang kuat mendadak" },
      { key: "C", text: "C. Air banjir mudah menguap dan habis diserap tanah" },
      { key: "D", text: "D. Guru akan memberikan nilai buruk jika melihat kita berenang" }
    ],
    correctAnswer: "B"
  },
  {
    id: 3,
    question: "Bahaya apa yang paling sering muncul dari letusan gunung berapi yang mengharuskan kita memakai masker saat di luar ruangan?",
    options: [
      { key: "A", text: "A. Aliran lahar dingin yang merusak jembatan sungai" },
      { key: "B", text: "B. Hujan abu vulkanik yang pekat dan berbahaya bagi saluran pernapasan" },
      { key: "C", text: "C. Suara dentuman petir letusan gunung yang sangat keras" },
      { key: "D", text: "D. Gempa bumi runtuhan lereng kawah gunung berapi" }
    ],
    correctAnswer: "B"
  },
  {
    id: 4,
    question: "Jika kamu mendengar sirene peringatan dini tsunami berbunyi di dekat pantai setelah gempa bumi besar, langkah darurat raga yang benar adalah...",
    options: [
      { key: "A", text: "A. Pergi ke dermaga pelabuhan untuk melihat apakah tsunami benar-benar datang" },
      { key: "B", text: "B. Berlari menjauhi pantai menuju perbukitan atau tempat tinggi yang telah ditentukan sebagai jalur evakuasi" },
      { key: "C", text: "C. Masuk ke dalam mobil dan menunggu kemacetan jalan terurai" },
      { key: "D", text: "D. Bersembunyi di bawah meja di dalam rumah tepi pantai" }
    ],
    correctAnswer: "B"
  },
  {
    id: 5,
    question: "Fungsi utama peluit kecil yang kita siapkan di dalam Tas Siaga Bencana raga adalah...",
    options: [
      { key: "A", text: "A. Untuk bermain musik bersama teman-teman saat di posko pengungsian" },
      { key: "B", text: "B. Untuk meniup sinyal suara darurat agar tim penyelamat mudah menemukan lokasi kita jika terjebak" },
      { key: "C", text: "C. Untuk menakuti hewan-hewan liar yang mendekati tenda darurat" },
      { key: "D", text: "D. Untuk tanda mulai makan bersama di dapur umum pengungsi" }
    ],
    correctAnswer: "B"
  }
];

interface DisasterQuizProps {
  type: "pre" | "post";
  grade: number;
  onQuizComplete: (score: number) => void;
}

export default function DisasterQuiz({ type, grade, onQuizComplete }: DisasterQuizProps) {
  const questions = type === "pre" ? PRE_TEST_QUESTIONS : POST_TEST_QUESTIONS;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const handleSelectOption = (optionKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIndex].id]: optionKey
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate final score
      let correctCount = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correctAnswer) {
          correctCount++;
        }
      });
      const score = Math.round((correctCount / questions.length) * 100);
      onQuizComplete(score);
    }
  };

  const currentQuestion = questions[currentIndex];
  const isSelected = answers[currentQuestion.id] !== undefined;

  return (
    <div className="bg-white border-4 border-indigo-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-[#1E293B]">
      {/* Test Title Header */}
      <div className="border-b-2 border-indigo-50 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="bg-indigo-50 text-indigo-750 text-[11px] font-black tracking-widest uppercase py-1 px-3.5 rounded-full border border-indigo-100">
            {type === "pre" ? "EVALUASI AWAL SISWA" : "EVALUASI AKHIR SISWA"}
          </span>
          <h3 className="text-xl font-black text-slate-800 mt-2 font-playful flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> {type === "pre" ? "Pre-Test Mitigasi Bencana" : "Post-Test Mitigasi Bencana"}
          </h3>
        </div>
        <div className="bg-indigo-50 px-4 py-1.5 rounded-2xl border border-indigo-100 text-xs font-black text-indigo-700">
          Soal {currentIndex + 1} dari {questions.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden border border-slate-200">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="space-y-4">
        <div className="bg-indigo-50/45 border-2 border-indigo-100 p-5 rounded-2xl">
          <h4 className="text-base font-bold text-slate-800 leading-relaxed flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <span>{currentQuestion.question}</span>
          </h4>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((opt) => {
            const isChosen = answers[currentQuestion.id] === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleSelectOption(opt.key)}
                className={`w-full p-4 text-left text-base font-semibold rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 active:scale-[0.99] ${
                  isChosen
                    ? "bg-indigo-50 border-indigo-600 text-indigo-800 font-extrabold shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-black shrink-0 ${
                    isChosen
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-slate-50 border-slate-350 text-slate-500"
                  }`}
                >
                  {opt.key}
                </div>
                <span>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          disabled={!isSelected}
          className={`py-3.5 px-8 rounded-2xl text-base font-black flex items-center gap-2 tracking-wide transition border-b-4 uppercase cursor-pointer ${
            isSelected
              ? "bg-indigo-600 hover:bg-indigo-550 border-indigo-800 text-white shadow-md active:scale-95"
              : "bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed"
          }`}
        >
          <span>
            {currentIndex === questions.length - 1
              ? type === "pre"
                ? "Selesai Pre-Test"
                : "Selesai Post-Test"
              : "Soal Selanjutnya"}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
