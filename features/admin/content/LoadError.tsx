import { Alert } from "@/components/ui/Alert";
import { AdminPageHeader } from "../AdminPageHeader";
import styles from "../AdminPage.module.less";

/** Shown instead of an editor when its data can't be read — never offer a blank form to save over real content. */
export function LoadError({ title }: { title: string }) {
  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <AdminPageHeader title={title} />
      <Alert tone="danger" title="Couldn't load the saved content">
        Editing is disabled so nothing gets overwritten. Refresh the page; if this keeps happening, check the
        database connection.
      </Alert>
    </div>
  );
}
