import React, { useState } from 'react'
import styled, { css } from 'styled-components'
import { User, Calendar } from 'lucide-react'

const InputWrapper = styled.label`
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 1.5rem;
  font-family: 'EB Garamond', serif;
  color: #ffe9b6;
  font-size: 1.08rem;
  letter-spacing: 0.01em;
`

const StyledInput = styled.input`
  background: transparent;
  border: none;
  border-bottom: 1.5px solid rgba(255, 215, 80, 0.35);
  outline: none;
  color: #fffbe9;
  font-size: 1.13rem;
  padding: 0.7rem 2.2rem 0.7rem 0.2rem;
  width: 100%;
  transition: border-color 0.2s;
  font-family: 'EB Garamond', serif;
  z-index: 1;

  &::placeholder {
    color: #ffe9b6a0;
    font-style: italic;
    opacity: 0.7;
  }

  &:focus ~ .golden-underline::after {
    width: 100%;
    opacity: 1;
  }
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
  right: 0.7rem;
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
    <InputWrapper>
      {label && <span style={{ marginRight: 8 }}>{label}</span>}
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
      <GoldenUnderline className="golden-underline" />
      <Icon $focused={focused}>
        {icon === 'user' ? <User size={18} /> : icon === 'calendar' ? <Calendar size={18} /> : null}
      </Icon>
    </InputWrapper>
  )
}
