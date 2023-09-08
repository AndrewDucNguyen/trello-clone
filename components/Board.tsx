'use client'

import { useBoardStore } from '@/store/BoardStore';
import React, { useEffect } from 'react'
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

function Board() {
    const [board, getBoard] = useBoardStore((state) => [
        state.board,
        state.getBoard]);

    useEffect(()=> {
        getBoard();
    }, [getBoard])


  return (
    <h1>Hello</h1>
    // <DragDropContext>
    //     <Droppable droppableId='board' direction='horizontal' type='column'>
    //         {(provided) => (
    //             <div>

    //             </div>
    //         )}
    //     </Droppable>
    // </DragDropContext>
  )
}

export default Board