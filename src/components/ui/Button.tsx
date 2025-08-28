import { ButtonHTMLAttributes } from 'react'; import { clsx } from 'clsx';
export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={clsx('btn', className)} />
}
export function ButtonPrimary(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className="btn btn-primary" />
}
