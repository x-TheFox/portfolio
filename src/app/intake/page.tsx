'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  Loader2,
  Briefcase,
  Code,
  FileText,
  Clock,
  Users,
  MessageSquare,
  CheckCircle,
  Sparkles,
  HelpCircle,
  Mail,
  Phone
} from 'lucide-react';

interface IntakeFormData {
  role: string;
  techStack: string;
  context: string;
  timeline: string;
  team: string;
  notes: string;
  email: string;
  phone: string;
}

interface ConversationState {
  iteration: number;
  questions: string[];
  answers: string[];
}

const STEPS = [
  { id: 'role', title: 'What role are you hiring for?', icon: Briefcase },
  { id: 'techStack', title: 'What tech stack is involved?', icon: Code },
  { id: 'context', title: 'Tell me about the project', icon: FileText },
  { id: 'timeline', title: "What's the timeline?", icon: Clock },
  { id: 'team', title: 'Describe the team structure', icon: Users },
  { id: 'email', title: "What's your email?", icon: Mail },
  { id: 'phone', title: 'Phone number (optional)', icon: Phone },
  { id: 'notes', title: 'Anything else to share?', icon: MessageSquare },
];

const TIMELINE_OPTIONS = [
  { value: 'urgent', label: 'Urgent (ASAP)' },
  { value: '1-2-weeks', label: '1-2 weeks' },
  { value: '1-month', label: 'Within a month' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'exploring', label: 'Just exploring' },
];

export default function IntakePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IntakeFormData>({
    role: '',
    techStack: '',
    context: '',
    timeline: '',
    team: '',
    notes: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Follow-up questions state
  const [conversation, setConversation] = useState<ConversationState>({
    iteration: 1,
    questions: [],
    answers: [],
  });
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const currentField = STEPS[currentStep].id as keyof IntakeFormData;
  const CurrentIcon = STEPS[currentStep].icon;
  const isLastStep = currentStep === STEPS.length - 1;
  const isComplete = response !== null;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFieldChange = (value: string) => {
    setFormData(prev => ({ ...prev, [currentField]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          iteration: conversation.iteration,
          previousQuestions: conversation.questions,
          previousAnswers: conversation.answers,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to process intake');
      }

      const data = await res.json();
      
      // Check if AI is asking follow-up questions
      if (data.type === 'questions' && data.questions?.length > 0) {
        setConversation(prev => ({
          ...prev,
          questions: data.questions,
        }));
        setFollowUpAnswers(new Array(data.questions.length).fill(''));
        setShowFollowUp(true);
      } else {
        // Final response received
        setResponse(data.response);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollowUpSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          iteration: 2,
          previousQuestions: conversation.questions,
          previousAnswers: followUpAnswers,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to process follow-up');
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isLastStep) {
        handleSubmit();
      } else {
        handleNext();
      }
    }
  };

  if (isComplete) {
    return <ResponseView response={response!} formData={formData} />;
  }

  // Show follow-up questions if AI asked them
  if (showFollowUp) {
    return (
      <FollowUpView
        questions={conversation.questions}
        answers={followUpAnswers}
        onAnswerChange={(index, value) => {
          const newAnswers = [...followUpAnswers];
          newAnswers[index] = value;
          setFollowUpAnswers(newAnswers);
        }}
        onSubmit={handleFollowUpSubmit}
        onBack={() => setShowFollowUp(false)}
        isSubmitting={isSubmitting}
        error={error}
      />
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm text-zinc-500">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}% complete
            </span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Question */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <CurrentIcon className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                {STEPS[currentStep].title}
              </h1>
            </div>

            {/* Input */}
            <div className="mb-8">
              {currentField === 'timeline' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TIMELINE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFieldChange(option.value)}
                      className={cn(
                        'p-4 rounded-lg border text-left transition-all',
                        formData.timeline === option.value
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={formData[currentField]}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={getPlaceholder(currentField)}
                  autoFocus
                  rows={currentField === 'context' || currentField === 'notes' ? 6 : 3}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-zinc-900 border border-zinc-800',
                    'text-white placeholder-zinc-600',
                    'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                    'resize-none transition-colors'
                  )}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg',
                  'text-zinc-400 hover:text-white transition-colors',
                  currentStep === 0 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <ArrowLeft size={18} />
                Back
              </button>

              {isLastStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
                    'bg-blue-600 text-white hover:bg-blue-500',
                    'transition-colors disabled:opacity-50'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
                    'bg-zinc-800 text-white hover:bg-zinc-700',
                    'transition-colors'
                  )}
                >
                  Next
                  <ArrowRight size={18} />
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Skip prompt */}
        <p className="text-center text-zinc-600 text-sm mt-8">
          Press Enter to continue, or click Next
        </p>
      </div>
    </main>
  );
}

function FollowUpView({ 
  questions, 
  answers, 
  onAnswerChange, 
  onSubmit, 
  onBack,
  isSubmitting,
  error 
}: { 
  questions: string[];
  answers: string[];
  onAnswerChange: (index: number, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">A few quick questions</h1>
          <p className="text-zinc-400">
            Help me better understand your needs so I can give you a more tailored response.
          </p>
        </motion.div>

        {/* Questions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {questions.map((question, index) => (
            <div key={index} className="space-y-2">
              <label className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <span className="text-zinc-200 font-medium">{question}</span>
              </label>
              <textarea
                value={answers[index]}
                onChange={(e) => onAnswerChange(index, e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
                className={cn(
                  'w-full px-4 py-3 rounded-xl ml-9',
                  'bg-zinc-900 border border-zinc-800',
                  'text-white placeholder-zinc-600',
                  'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                  'resize-none transition-colors'
                )}
              />
            </div>
          ))}
        </motion.div>

        {/* Error message */}
        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between mt-8"
        >
          <button
            onClick={onBack}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'text-zinc-400 hover:text-white transition-colors'
            )}
          >
            <ArrowLeft size={18} />
            Back to form
          </button>

          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-lg font-medium',
              'bg-blue-600 text-white hover:bg-blue-500',
              'transition-colors disabled:opacity-50'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send size={18} />
                Get Response
              </>
            )}
          </button>
        </motion.div>
      </div>
    </main>
  );
}

function ResponseView({ response, formData }: { response: string; formData: IntakeFormData }) {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Thanks for reaching out!</h1>
          <p className="text-zinc-400">
            Here&apos;s a personalized response based on your needs.
          </p>
        </motion.div>

        {/* AI Response */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            'relative p-6 md:p-8 rounded-2xl',
            'bg-gradient-to-br from-zinc-900 to-zinc-950',
            'border border-zinc-800'
          )}
        >
          {/* AI badge */}
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wider">
              AI-Generated Response
            </span>
          </div>

          {/* Response content */}
          <div className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-strong:text-white prose-p:text-zinc-300 prose-li:text-zinc-300 prose-ol:text-zinc-300 prose-ul:text-zinc-300">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-zinc-300 leading-relaxed mb-4">{children}</p>,
                strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-zinc-300">{children}</ol>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-zinc-300">{children}</ul>,
                li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold text-white mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold text-white mb-2">{children}</h3>,
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        </motion.div>

        {/* Summary of submission */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800"
        >
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Your submission summary:</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-zinc-500">Role</dt>
              <dd className="text-zinc-300">{formData.role || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Timeline</dt>
              <dd className="text-zinc-300">{formData.timeline || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Tech Stack</dt>
              <dd className="text-zinc-300">{formData.techStack || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Contact</dt>
              <dd className="text-zinc-300">{formData.email || 'Not provided'}</dd>
            </div>
          </dl>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
        >
          <a
            href="/"
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'px-6 py-3 rounded-lg font-medium',
              'border border-zinc-700 text-zinc-300',
              'hover:bg-zinc-800/50 transition-colors'
            )}
          >
            Back to Portfolio
          </a>
          <a
            href="mailto:hello@example.com"
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'px-6 py-3 rounded-lg font-medium',
              'bg-blue-600 text-white hover:bg-blue-500',
              'transition-colors'
            )}
          >
            Send Follow-up Email
          </a>
        </motion.div>
      </div>
    </main>
  );
}

function getPlaceholder(field: string): string {
  const placeholders: Record<string, string> = {
    role: 'e.g., Senior Full-Stack Developer, Frontend Engineer, Tech Lead...',
    techStack: 'e.g., React, Node.js, PostgreSQL, AWS...',
    context: 'Tell me about the project, product, or challenge you\'re working on...',
    team: 'e.g., 5-person engineering team, startup, enterprise...',
    email: 'your@email.com',
    phone: '+1 (555) 123-4567 (optional)',
    notes: 'Anything else that would help me understand your needs better...',
  };
  return placeholders[field] || '';
}
