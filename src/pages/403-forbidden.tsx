import { ErrorPage } from './error-page';

export function ForbiddenPage() {
  return <ErrorPage code={403} />;
}