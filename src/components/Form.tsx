import React from 'react';
import clsx from 'clsx';

type LabelProps = {
  htmlFor?: string;
  className?: string;
};

const Label: React.FC<LabelProps> = ({ htmlFor, className, children }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx('leading-normal focus:shadow-outline', className)}
    >
      {children}
    </label>
  );
};

type InputType = 'text' | 'number' | 'date' | 'checkbox' | 'radio';

type InputProps = {
  id?: string;
  name?: string;
  value?: string;
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
};

const Input: (type: InputType) => React.FC<InputProps> = (type) => ({
  id,
  name,
  value,
  label,
  checked,
  disabled,
  placeholder,
  size = 'md',
  onChange,
  className,
  children,
  ...other
}) => {
  const padding = { sm: 'px-2 py-1', md: 'px-3 py-1.5', lg: 'px-4 py-2' };
  const textSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const baseClass = 'rounded border leading-tight border-gray-300 shadow-md';
  const checkbox = type === 'checkbox' || type === 'radio';

  const input = (
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      checked={checked}
      disabled={disabled}
      placeholder={placeholder}
      onChange={onChange}
      className={clsx(
        baseClass,
        textSize[size],
        padding[size],
        !checkbox && 'block',
        // checkbox && 'focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
        className
      )}
      {...other}
    />
  );

  return checkbox && label ? (
    <Label htmlFor={id}>
      {input}
      <span className="pl-2">{label}</span>
    </Label>
  ) : (
    input
  );
};

type SelectProps = {
  id?: string;
  name?: string;
  value?: string;
  label?: string;
  options: { label: string; value: string }[] | string[];
  size?: 'sm' | 'md' | 'lg';
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  className?: string;
};

const Select: React.FC<SelectProps> = ({
  id,
  name,
  value,
  label,
  options,
  size = 'md',
  onChange,
  className,
}) => {
  const padding = { sm: 'px-2 py-1', md: 'px-3 py-2', lg: 'px-4 py-2' };
  const textSize = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
  const baseClass = 'text-base block border border-gray-300 rounded shadow-md';

  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      className={clsx(baseClass, padding[size], textSize[size], className)}
    >
      {label && <option value="">{label}</option>}
      {options.map((option: { label: string; value: string } | string) =>
        typeof option === 'string' ? (
          <option value={option}>{option}</option>
        ) : (
          <option value={option.value}>{option.label}</option>
        )
      )}
    </select>
  );
};

type TextAreaProps = {
  id?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
};

const TextArea: React.FC<TextAreaProps> = ({
  id,
  name,
  value,
  placeholder,
  rows,
  className,
  children,
  ...other
}) => {
  const baseClass = 'block shadow-md border-gray-300 p-2';

  return (
    <textarea
      id={id}
      name={name}
      value={value}
      placeholder={placeholder}
      rows={rows}
      className={clsx(baseClass, className)}
    />
  );
};

const InputText = Input('text');
const InputNumber = Input('number');
const InputDate = Input('date');
const InputCheckbox = Input('checkbox');
const InputRadio = Input('radio');

type FormProps = {
  className?: string;
};

type FormType = React.FC<FormProps> & {
  Label: typeof Label;
  Text: typeof InputText;
  Number: typeof InputNumber;
  Date: typeof InputDate;
  Checkbox: typeof InputCheckbox;
  Radio: typeof InputRadio;
  Select: typeof Select;
  TextArea: typeof TextArea;
};

const Form: FormType = ({ className, children }) => {
  return <form className={className}>{children}</form>;
};

Form.Text = InputText;
Form.Number = InputNumber;
Form.Label = Label;
Form.Date = InputDate;
Form.Checkbox = InputCheckbox;
Form.Radio = InputRadio;
Form.Select = Select;
Form.TextArea = TextArea;

export default Form;
