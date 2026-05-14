import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import HelpTooltip from './HelpTooltip'

interface HelpInfo {
  content: string
  link?: {
    url: string
    label: string
  }
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
  help?: HelpInfo
  renderRight?: ReactNode
}

export function AdminInput({ label, hint, error, icon, help, renderRight, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
          {label}
          {props.required && <span className="text-red-400">*</span>}
          {help && <HelpTooltip content={help.content} link={help.link} />}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lz-muted">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full px-3.5 py-2.5 
            bg-lz-dark/50 
            border border-lz-border/50 
            rounded-lg 
            text-white text-sm
            placeholder-lz-muted/60
            focus:outline-none focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/20
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : ''}
            ${renderRight ? 'pr-20' : ''}
            ${error ? 'border-red-500/50' : ''}
            ${className}
          `}
        />
        {renderRight && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            {renderRight}
          </div>
        )}
      </div>
      {hint && !error && <p className="text-xs text-lz-muted">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
  help?: HelpInfo
}

export function AdminSelect({ label, hint, error, options, help, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
          {label}
          {props.required && <span className="text-red-400">*</span>}
          {help && <HelpTooltip content={help.content} link={help.link} />}
        </label>
      )}
      <select
        {...props}
        className={`
          w-full px-3.5 py-2.5 
          bg-lz-dark/50 
          border border-lz-border/50 
          rounded-lg 
          text-white text-sm
          focus:outline-none focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/20
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500/50' : ''}
          ${className}
        `}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="text-xs text-lz-muted">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  help?: HelpInfo
}

export function AdminTextarea({ label, hint, error, help, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
          {label}
          {props.required && <span className="text-red-400">*</span>}
          {help && <HelpTooltip content={help.content} link={help.link} />}
        </label>
      )}
      <textarea
        {...props}
        className={`
          w-full px-3.5 py-2.5 
          bg-lz-dark/50 
          border border-lz-border/50 
          rounded-lg 
          text-white text-sm
          placeholder-lz-muted/60
          focus:outline-none focus:border-lz-accent/50 focus:ring-1 focus:ring-lz-accent/20
          transition-all duration-200
          resize-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500/50' : ''}
          ${className}
        `}
      />
      {hint && !error && <p className="text-xs text-lz-muted">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  help?: HelpInfo
}

export function AdminCheckbox({ label, help, className = '', ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        {...props}
        className={`
          w-4 h-4 
          rounded 
          border-lz-border/50 
          bg-lz-dark/50 
          text-lz-accent 
          focus:ring-lz-accent/20 focus:ring-offset-0
          transition-colors
          ${className}
        `}
      />
      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
        {label}
      </span>
      {help && <HelpTooltip content={help.content} link={help.link} />}
    </label>
  )
}
