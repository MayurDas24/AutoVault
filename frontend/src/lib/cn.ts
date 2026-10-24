type ClassValue = string | false | null | undefined

/** Joins truthy class names into a single string. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}