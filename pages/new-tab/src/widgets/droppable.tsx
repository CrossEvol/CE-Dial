import { useDroppable } from '@dnd-kit/core';
import type { PropsWithChildren } from 'react';

interface IProps extends PropsWithChildren {
  id: string;
}

export function Droppable(props: IProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
  });
  const style = {
    color: isOver ? 'green' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {props.children}
    </div>
  );
}
