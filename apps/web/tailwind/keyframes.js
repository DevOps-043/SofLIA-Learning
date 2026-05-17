const keyframes = {
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' },
  },
  slideUp: {
    '0%': { transform: 'translateY(20px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
  slideIn: {
    from: { transform: 'translateX(400px)', opacity: '0' },
    to: { transform: 'translateX(0)', opacity: '1' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },
  buttonShimmer: {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
  buttonBounce: {
    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
    '40%': { transform: 'translateY(-4px)' },
    '60%': { transform: 'translateY(-2px)' },
  },
  buttonGlow: {
    '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 179, 0.5)' },
    '50%': { boxShadow: '0 0 20px rgba(0, 212, 179, 0.8), 0 0 30px rgba(0, 212, 179, 0.6)' },
  },
  gradientShift: {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
  float: {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '33%': { transform: 'translateY(-10px) rotate(1deg)' },
    '66%': { transform: 'translateY(5px) rotate(-1deg)' },
  },
  parallaxFloat: {
    '0%': { transform: 'translateY(0px) translateX(0px)' },
    '50%': { transform: 'translateY(-20px) translateX(10px)' },
    '100%': { transform: 'translateY(0px) translateX(0px)' },
  },
  borderGlow: {
    '0%': { borderColor: 'rgba(0, 212, 179, 0.3)', boxShadow: '0 0 5px rgba(0, 212, 179, 0.2)' },
    '50%': { borderColor: 'rgba(0, 212, 179, 0.6)', boxShadow: '0 0 15px rgba(0, 212, 179, 0.4)' },
    '100%': { borderColor: 'rgba(0, 212, 179, 0.3)', boxShadow: '0 0 5px rgba(0, 212, 179, 0.2)' },
  },
  shimmerGradient: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
  slideInUp: {
    from: { transform: 'translateY(30px)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  scaleIn: {
    from: { transform: 'scale(0.9)', opacity: '0' },
    to: { transform: 'scale(1)', opacity: '1' },
  },
  ripple: {
    '0%': { transform: 'scale(0)', opacity: '1' },
    '100%': { transform: 'scale(2)', opacity: '0' },
  },
  pulseGlow: {
    '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 179, 0.3)' },
    '50%': { boxShadow: '0 0 20px rgba(0, 212, 179, 0.6), 0 0 30px rgba(0, 212, 179, 0.4)' },
  },
  communitiesOrb1: {
    '0%, 100%': { transform: 'translate(0, 0)' },
    '50%': { transform: 'translate(100px, -50px)' },
  },
  communitiesOrb2: {
    '0%, 100%': { transform: 'translate(0, 0)' },
    '50%': { transform: 'translate(-50px, 50px)' },
  },
}

module.exports = { keyframes }
