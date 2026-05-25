const { animations } = require('./animations')
const { colors } = require('./colors')
const { keyframes } = require('./keyframes')
const {
  backdropBlur,
  borderRadius,
  boxShadow,
  spacing,
} = require('./layout')
const { fontFamily, fontSize } = require('./typography')

const themeExtend = {
  colors,
  fontFamily,
  fontSize,
  spacing,
  borderRadius,
  boxShadow,
  backdropBlur,
  animation: animations,
  keyframes,
}

module.exports = { themeExtend }
