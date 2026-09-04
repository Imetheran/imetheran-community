import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function AdminBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="admin-breadcrumbs" aria-label="Fil d’Ariane de l’administration">
      <Link href="/administration">Administration</Link>
      {items.map((item, index) => (
        <span className="admin-breadcrumbs__item" key={`${item.label}-${index}`}>
          <span aria-hidden="true">›</span>
          {item.href ? <Link href={item.href}>{item.label}</Link> : <strong>{item.label}</strong>}
        </span>
      ))}
    </nav>
  );
}
