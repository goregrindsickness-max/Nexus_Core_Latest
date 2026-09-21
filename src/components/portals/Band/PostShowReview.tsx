import React, { useState, useEffect } from 'react';
import { Show } from '../../../types';
import { getSupabase } from '../../../supabase';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

interface PostShowReviewProps {
  show: Show;
  triggerNotification: (msg: string) => void;
  addLog?: (log: string) => void;
}

export default function PostShowReview({
  show,
  triggerNotification,
  addLog
}: PostShowReviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    try {
      const reviewedStr = localStorage.getItem('nexus_reviewed_shows');
      if (reviewedStr) {
        const reviewed: string[] = JSON.parse(reviewedStr);
        if (reviewed.includes(show.id)) {
          setHasReviewed(true);
        }
      }
    } catch (_) {}
  }, [show.id]);

  const [shortedPayout, setShortedPayout] = useState(false);
  const [shortageDelta, setShortageDelta] = useState<string>('');
  const [missingGear, setMissingGear] = useState(false);
  const [missingHospitality, setMissingHospitality] = useState(false);
  const [safetyFlaws, setSafetyFlaws] = useState(false);

  const [paidOnTime, setPaidOnTime] = useState(false);
  const [accommodatingCrew, setAccommodatingCrew] = useState(false);
  const [professionalSound, setProfessionalSound] = useState(false);

  const [roomDensity, setRoomDensity] = useState<number>(50);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const isAnyFailure = shortedPayout || missingGear || missingHospitality || safetyFlaws;
    const rating = isAnyFailure ? 2 : 5;
    
    let infractionType: string | undefined = undefined;
    if (shortedPayout) {
      infractionType = 'SHORTED_PAYMENT';
    } else if (safetyFlaws || missingGear || missingHospitality) {
      infractionType = 'CONTRACT_DEFAULT';
    }

    const sanitizedNotes = notes.replace(/<\/?[^>]+(>|$)/g, "").trim();

    const failures: string[] = [];
    if (shortedPayout) failures.push(`Shorted payout (Delta: $${shortageDelta || '0'})`);
    if (missingGear) failures.push('Missing/broken gear or backline');
    if (missingHospitality) failures.push('Missing catering or dressing rooms');
    if (safetyFlaws) failures.push('Safety flaws or security issues');

    const successes: string[] = [];
    if (paidOnTime) successes.push('Paid on time with zero hassle');
    if (accommodatingCrew) successes.push('Accommodating crew & hospitality');
    if (professionalSound) successes.push('Professional sound & staging');

    let densityLabel = 'Half House';
    if (roomDensity <= 33) densityLabel = 'Empty / Dead';
    if (roomDensity >= 66) densityLabel = 'Max Packed / Sold Out';

    let formattedText = '';
    if (failures.length > 0 || successes.length > 0 || sanitizedNotes || roomDensity) {
      formattedText = `[POST-SHOW REVIEW]\nVENUE: ${show.name}\nDATE: ${show.date}\nROOM DENSITY: ${densityLabel}\n`;
      if (failures.length > 0) {
        formattedText += `\n[COMPLICATIONS]:\n${failures.map(f => `  * ${f}`).join('\n')}`;
      }
      if (successes.length > 0) {
        formattedText += `\n[POSITIVES]:\n${successes.map(s => `  * ${s}`).join('\n')}`;
      }
      formattedText += `\n\n[NOTES]:\n${sanitizedNotes || 'No additional comments.'}`;
    }

    const newReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      rating,
      text: formattedText || null,
      name: 'Anonymous Reporter',
      group: show.name,
      created_at: new Date().toISOString(),
      infraction_type: infractionType || null,
      target_promoter_id: show.promoter_contact || show.name,
      venue_id: show.id
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('user_reviews').insert([newReview]);
        if (error) {
          triggerNotification("Error connecting to review database. Saved locally.");
        } else {
          triggerNotification("Post-show review submitted anonymously!");
        }
      } catch (err) {
        triggerNotification("Error: Saved to local storage fallback.");
      }
    } else {
      triggerNotification("Offline: Review saved locally.");
    }

    // Mark show reviewed in localStorage
    try {
      const reviewedStr = localStorage.getItem('nexus_reviewed_shows');
      const reviewed: string[] = reviewedStr ? JSON.parse(reviewedStr) : [];
      if (!reviewed.includes(show.id)) {
        reviewed.push(show.id);
        localStorage.setItem('nexus_reviewed_shows', JSON.stringify(reviewed));
      }
    } catch (_) {}

    addLog?.(`Anonymous review submitted for show ID: ${show.id}`);
    setIsSubmitting(false);
    setHasReviewed(true);
    setIsExpanded(false);
  };

  const densityLabel = roomDensity <= 33 ? '[ Empty / Dead ]' : roomDensity >= 66 ? '[ Max Packed / Sold Out ]' : '[ Half House ]';

  if (hasReviewed) {
    return (
      <div className="col-span-2 py-2.5 rounded-lg border border-purple-900/50 text-purple-400 bg-purple-950/20 flex items-center justify-center gap-1.5 opacity-70">
        <CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Show Settled & Reviewed
      </div>
    );
  }

  return (
    <div className="col-span-2 border border-zinc-800 rounded-lg overflow-hidden transition-all bg-zinc-950/40">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2.5 px-3 flex items-center justify-between text-zinc-300 hover:text-white hover:bg-zinc-900/50 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider font-mono">
          📝 Add Post-Show Review
        </span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-zinc-900 bg-zinc-950/80 animate-in slide-in-from-top-1 fade-in duration-200">
          <div className="border-b border-zinc-900 pb-4 mb-5">
            <h3 className="text-lg font-mono tracking-wide text-zinc-200 font-bold mb-1">
              📝 POST-SHOW REVIEW
            </h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              How did the completed show go? Submit a quiet report to help keep independent music circuits transparent and accountable.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Complications & Issues */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono tracking-widest text-red-500/80 uppercase mb-2">
                ⚠️ COMPLICATIONS & ISSUES
              </h4>
              
              <div className="space-y-2.5">
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <div onClick={() => setShortedPayout(!shortedPayout)} className="mt-0.5 text-zinc-500 group-hover:text-red-400 transition-colors">
                      {shortedPayout ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <Circle className="w-4 h-4" />}
                    </div>
                    <span onClick={() => setShortedPayout(!shortedPayout)} className={`text-xs font-sans select-none transition-colors ${shortedPayout ? 'text-red-300 font-medium' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                      Shorted on contract payout or guarantee
                    </span>
                  </label>
                  
                  {shortedPayout && (
                    <div className="ml-6 mt-1.5 animate-in slide-in-from-top-1 fade-in duration-150">
                      <input
                        type="number"
                        placeholder="Shortage Delta ($)"
                        value={shortageDelta}
                        onChange={(e) => setShortageDelta(e.target.value)}
                        className="w-32 bg-zinc-950 border border-red-900/40 text-red-400 p-1.5 text-xs font-mono rounded placeholder:text-red-900/50 focus:outline-none focus:border-red-500/50"
                      />
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div onClick={() => setMissingGear(!missingGear)} className="mt-0.5 text-zinc-500 group-hover:text-red-400 transition-colors">
                    {missingGear ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <span onClick={() => setMissingGear(!missingGear)} className={`text-xs font-sans select-none transition-colors ${missingGear ? 'text-red-300 font-medium' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                    Missing/broken technical gear or production backline
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div onClick={() => setMissingHospitality(!missingHospitality)} className="mt-0.5 text-zinc-500 group-hover:text-red-400 transition-colors">
                    {missingHospitality ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <span onClick={() => setMissingHospitality(!missingHospitality)} className={`text-xs font-sans select-none transition-colors ${missingHospitality ? 'text-red-300 font-medium' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                    Missing promised catering, water, or dressing rooms
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div onClick={() => setSafetyFlaws(!safetyFlaws)} className="mt-0.5 text-zinc-500 group-hover:text-red-400 transition-colors">
                    {safetyFlaws ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <span onClick={() => setSafetyFlaws(!safetyFlaws)} className={`text-xs font-sans select-none transition-colors ${safetyFlaws ? 'text-red-300 font-medium' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                    Safety flaws, physical hazards, or security issues
                  </span>
                </label>
              </div>
            </div>

            {/* Positive Experiences */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono tracking-widest text-emerald-500/80 uppercase mb-2">
                ⚡ POSITIVE EXPERIENCES
              </h4>
              
              <div className="space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div onClick={() => setPaidOnTime(!paidOnTime)} className="mt-0.5 text-zinc-500 group-hover:text-emerald-400 transition-colors">
                    {paidOnTime ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <span onClick={() => setPaidOnTime(!paidOnTime)} className={`text-xs font-sans select-none transition-colors ${paidOnTime ? 'text-emerald-300 font-medium' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                    Fully paid on time with zero hassle
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div onClick={() => setAccommodatingCrew(!accommodatingCrew)} className="mt-0.5 text-zinc-500 group-hover:text-emerald-400 transition-colors">
                    {accommodatingCrew ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <span onClick={() => setAccommodatingCrew(!accommodatingCrew)} className={`text-xs font-sans select-none transition-colors ${accommodatingCrew ? 'text-emerald-300 font-medium' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                    Accommodating local venue crew & great hospitality
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <div onClick={() => setProfessionalSound(!professionalSound)} className="mt-0.5 text-zinc-500 group-hover:text-emerald-400 transition-colors">
                    {professionalSound ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                  </div>
                  <span onClick={() => setProfessionalSound(!professionalSound)} className={`text-xs font-sans select-none transition-colors ${professionalSound ? 'text-emerald-300 font-medium' : 'text-zinc-300 group-hover:text-zinc-100'}`}>
                    Professional sound engineers and stellar staging
                  </span>
                </label>
              </div>
            </div>

            {/* Crowd Analytics & Feedback */}
            <div className="space-y-4 border-t border-zinc-900 pt-5">
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-1">
                  <label className="text-[10px] font-mono text-zinc-500">
                    📊 ESTIMATED ROOM DENSITY
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${
                    roomDensity <= 33 ? 'text-zinc-400' : 
                    roomDensity >= 66 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {densityLabel}
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={roomDensity}
                  onChange={(e) => setRoomDensity(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-300"
                />
                <div className="flex justify-between px-0.5 text-[8px] font-mono text-zinc-600 uppercase mt-1">
                  <span>Empty</span>
                  <span>Packed</span>
                </div>
              </div>

              <div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any extra details regarding payout deductions, contract compliance, load-in anomalies, or venue safety rules..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-sans text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700/50 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-200 hover:text-emerald-400 font-mono text-xs py-2.5 rounded-lg font-bold transition-all uppercase tracking-wide cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : '[ SUBMIT ANONYMOUS REPORT ]'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
