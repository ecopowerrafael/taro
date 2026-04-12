import React, { useState } from 'react'
import styled, { css } from 'styled-components'
import { User, Calendar } from 'lucide-react'

const SacredInputWrapper = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 1.5rem;
  position: relative;
`

const Label = styled.span`
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #ffe066cc;
  font-family: 'EB Garamond', serif;
  font-weight: 600;
  margin-left: 0.2rem;
`

const InputRow = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`

const StyledInput = styled.input`
  background: transparent;
  border: none;
  border-bottom: 1.7px solid #ffe06655;
  outline: none;
  color: #fffbe9;
  font-size: 1.13rem;
  padding: 0.7rem 0.2rem 0.7rem 2.2rem;
  width: 100%;
  font-family: 'EB Garamond', serif;
  transition: border-color 0.2s;
  z-index: 1;
  &::placeholder {
    color: #ffe9b6a0;
    font-style: italic;
    opacity: 0.7;
  }
`

const goldenExpand = styled.keyframes`
  0% { left: 50%; right: 50%; opacity: 0; }
  40% { opacity: 1; }
  100% { left: 0; right: 0; opacity: 1; }
`

const GoldenLine = styled.span`
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 2.5px;
  background: linear-gradient(90deg, #ffe066 0%, #bfa14a 100%);
  border-radius: 2px;
  opacity: 0;
  pointer-events: none;
  z-index: 2;
  ${({ $focused }) => $focused && css`
    animation: ${goldenExpand} 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
    opacity: 1;
  `}
`

const GoldenUnderline = styled.span`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  pointer-events: none;
  z-index: 2;
  &::after {
    content: '';
    display: block;
    height: 2px;
    width: 0;
    background: linear-gradient(90deg, #ffe066 0%, #ffd700 100%);
    border-radius: 2px;
    transition: width 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s;
    opacity: 0;
  }
`

const Icon = styled.span`
  position: absolute;
  left: 0.2rem;
  top: 50%;
  transform: translateY(-50%);
  color: #b6b6b6;
  transition: color 0.3s;
  z-index: 3;
  ${({ $focused }) =>
    $focused &&
    css`
      color: #ffd700;
      filter: drop-shadow(0 0 4px #ffe066cc);
    `}
`

export function SacredInput({ label, icon, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <SacredInputWrapper>
      <Label>{label}</Label>
      <InputRow>
        <Icon $focused={focused}>
          {icon === 'user' ? <User size={18} /> : icon === 'calendar' ? <Calendar size={18} /> : null}
        </Icon>
        <StyledInput
          {...props}
          onFocus={e => {
            setFocused(true)
            props.onFocus && props.onFocus(e)
          }}
          onBlur={e => {
            setFocused(false)
            props.onBlur && props.onBlur(e)
          }}
        />
        <GoldenLine $focused={focused} />
      </InputRow>
    </SacredInputWrapper>
  )
}
