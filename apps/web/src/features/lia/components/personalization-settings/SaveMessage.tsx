import { motion } from 'framer-motion';

export function SaveMessage(props: {
  message: { text: string; type: 'error' | 'success' } | null;
}) {
  if (!props.message) {
    return null;
  }

  const classes =
    props.message.type === 'success'
      ? 'bg-green-500/10 border border-green-500/20 text-green-500'
      : 'bg-red-500/10 border border-red-500/20 text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg ${classes}`}
    >
      {props.message.text}
    </motion.div>
  );
}
