export const updateState = (state, nextState) => Object.assign(state, nextState) 

export const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

export const isEqualValues = (variable, values) => values.includes(variable)