'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'

interface PollAttachmentData {
  question?: string
  options?: string[]
  votes?: Record<string, string[]>
}

interface InteractivePollProps {
  attachmentData: PollAttachmentData
  postId?: string
  communitySlug?: string
}

export function InteractivePoll({
  attachmentData,
  postId,
  communitySlug,
}: InteractivePollProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [userVote, setUserVote] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const [pollData, setPollData] = useState(attachmentData)
  const [voteSuccess, setVoteSuccess] = useState(false)
  const pollId = `poll-${postId || 'default'}-${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    if (postId && communitySlug) {
      void loadUserVote()
    }
  }, [postId, communitySlug])

  const loadUserVote = async () => {
    try {
      const response = await fetch(
        `/api/communities/${communitySlug}/polls/${postId}/vote`,
      )
      if (response.ok) {
        const data = await response.json()
        setUserVote(data.userVote)
        setSelectedOption(data.userVote)
        if (data.pollData) {
          setPollData(data.pollData)
        }
      }
    } catch {}
  }

  const handleVote = async () => {
    if (!selectedOption || !postId || !communitySlug || isVoting) {
      return
    }

    setIsVoting(true)
    try {
      const response = await fetch(
        `/api/communities/${communitySlug}/polls/${postId}/vote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            option: selectedOption,
            action: 'vote',
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        setPollData(data.pollData)
        setUserVote(selectedOption)
        setVoteSuccess(true)
        setTimeout(() => setVoteSuccess(false), 2000)
      } else {
        const error = await response.json()
        alert(error.error || 'Error al votar')
      }
    } catch {
      alert('Error al votar')
    } finally {
      setIsVoting(false)
    }
  }

  const calculatePercentage = (option: string) => {
    if (!pollData || !pollData.votes || typeof pollData.votes !== 'object') {
      return 0
    }
    if (!pollData.votes[option]) {
      return 0
    }

    const totalVotes = Object.values(pollData.votes).reduce(
      (total: number, votes: string[]) =>
        total + (Array.isArray(votes) ? votes.length : 0),
      0,
    )
    if (totalVotes === 0) {
      return 0
    }
    const optionVotes = Array.isArray(pollData.votes[option])
      ? pollData.votes[option].length
      : 0
    return Math.round((optionVotes / totalVotes) * 100)
  }

  const getTotalVotes = () => {
    if (!pollData || !pollData.votes || typeof pollData.votes !== 'object') {
      return 0
    }

    return Object.values(pollData.votes).reduce(
      (total: number, votes: string[]) =>
        total + (Array.isArray(votes) ? votes.length : 0),
      0,
    )
  }

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-slate-800/60 dark:to-slate-900/60 border border-gray-200 dark:border-slate-600/50 rounded-xl p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 flex items-center justify-center shadow-lg">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
            Encuesta
          </h4>
          <p className="text-xs text-gray-600 dark:text-slate-400">
            Participa en la votaciÃ³n
          </p>
        </div>
        <div className="bg-gray-100 dark:bg-slate-700/50 rounded-lg px-3 py-1">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
            {getTotalVotes()} {getTotalVotes() === 1 ? 'voto' : 'votos'}
          </span>
        </div>
      </div>
      <h5 className="text-gray-900 dark:text-white text-lg font-medium mb-4 leading-relaxed">
        {pollData?.question}
      </h5>
      <div className="space-y-3">
        {pollData?.options?.map((option: string, index: number) => {
          const percentage = calculatePercentage(option)
          const isSelected = selectedOption === option

          return (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer group overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-2 border-orange-400/50 dark:border-orange-400/50 shadow-lg shadow-orange-500/20'
                    : 'bg-gray-50 dark:bg-slate-700/30 border border-gray-300 dark:border-slate-600/30 hover:bg-gray-100 dark:hover:bg-slate-600/40 hover:border-gray-400 dark:hover:border-slate-500/50'
                }`}
                onClick={() => setSelectedOption(option)}
              >
                <div className="relative">
                  <input
                    type="radio"
                    name={pollId}
                    value={option}
                    id={`${pollId}-option-${index}`}
                    checked={isSelected}
                    onChange={() => setSelectedOption(option)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-orange-400 bg-orange-400 dark:border-orange-400 dark:bg-orange-400'
                        : 'border-gray-400 dark:border-slate-400 group-hover:border-gray-500 dark:group-hover:border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <label
                    htmlFor={`${pollId}-option-${index}`}
                    className={`block text-sm font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white'
                    }`}
                  >
                    {option}
                  </label>

                  {getTotalVotes() > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-slate-400">
                          {percentage}% â€¢{' '}
                          {Array.isArray(pollData.votes?.[option])
                            ? pollData.votes[option].length
                            : 0}{' '}
                          votos
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-slate-600/50 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            isSelected
                              ? 'bg-gradient-to-r from-orange-400 to-amber-400'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-slate-400 dark:to-slate-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{
                            duration: 0.8,
                            ease: 'easeOut',
                            delay: index * 0.1,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`text-sm font-bold px-2 py-1 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-orange-400/20 text-orange-700 dark:text-orange-300'
                      : 'bg-gray-200 dark:bg-slate-600/50 text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {percentage}%
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div className="text-xs text-gray-600 dark:text-slate-500">
          {getTotalVotes() > 0
            ? `${getTotalVotes()} personas han votado`
            : 'SÃ© el primero en votar'}
        </div>

        <div className="flex items-center gap-3">
          {voteSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2 text-green-400 text-sm font-medium flex items-center gap-2"
            >
              Â¡Voto registrado!
            </motion.div>
          )}

          <motion.button
            onClick={() => void handleVote()}
            disabled={!selectedOption || isVoting}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg ${
              voteSuccess
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25'
                : isVoting
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105'
            }`}
            whileHover={!isVoting && !voteSuccess ? { scale: 1.05 } : {}}
            whileTap={!isVoting && !voteSuccess ? { scale: 0.95 } : {}}
          >
            {isVoting
              ? 'Votando...'
              : userVote
                ? 'Cambiar voto'
                : 'Votar'}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
