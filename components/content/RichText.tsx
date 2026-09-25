import { Fragment } from "react";
import type { BlockNode, InlineNode } from "@/lib/markup/Markup";
import { cn } from "@/lib/cn";
import styles from "./RichText.module.less";

function Inline({ nodes }: { nodes: readonly InlineNode[] }) {
  return nodes.map((node, i) => {
    switch (node.type) {
      case "text":
        return <Fragment key={i}>{node.value}</Fragment>;
      case "strong":
        return (
          <strong key={i}>
            <Inline nodes={node.children} />
          </strong>
        );
      case "link":
        return node.external ? (
          <a key={i} href={node.href} target="_blank" rel="noopener noreferrer nofollow">
            <Inline nodes={node.children} />
          </a>
        ) : (
          <a key={i} href={node.href}>
            <Inline nodes={node.children} />
          </a>
        );
    }
  });
}

/** Renders a parsed Markup tree (see lib/markup/Markup.ts) as semantic elements. */
export function RichText({ blocks, className }: { blocks: readonly BlockNode[]; className?: string }) {
  return (
    <div className={cn(styles.richText, className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const Heading = block.level === 2 ? "h2" : "h3";
            return (
              <Heading key={i} id={block.id}>
                <Inline nodes={block.children} />
              </Heading>
            );
          }
          case "paragraph":
            return (
              <p key={i}>
                <Inline nodes={block.children} />
              </p>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inline nodes={item} />
                  </li>
                ))}
              </List>
            );
          }
        }
      })}
    </div>
  );
}
