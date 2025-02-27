import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

interface IProps {
  id: string;
  element?: React.ElementType;
  children: (props: { listeners?: SyntheticListenerMap }) => ReactNode;
}

export function SortableItem(props: IProps) {
  const Element = props.element || 'div';
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Element ref={setNodeRef} style={style} {...attributes} className="cursor-grab">
      {props.children({ listeners })}
    </Element>
  );
}
