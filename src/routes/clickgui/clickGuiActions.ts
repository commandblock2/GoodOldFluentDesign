type SettingHeights = Record<number, number>;

function readObservedBlockSize(
    entry: ResizeObserverEntry,
): number | null {
    const borderBoxSize = entry.borderBoxSize as
        | ResizeObserverSize
        | readonly ResizeObserverSize[]
        | undefined;

    if (Array.isArray(borderBoxSize)) {
        return borderBoxSize[0]?.blockSize ?? null;
    }

    const singleBorderBoxSize = borderBoxSize as
        | ResizeObserverSize
        | undefined;
    if (singleBorderBoxSize !== undefined) {
        return singleBorderBoxSize.blockSize;
    }

    return null;
}

export function createSettingHeightTracker(
    readSettingHeights: () => SettingHeights,
    writeSettingHeights: (nextHeights: SettingHeights) => void,
) {
    return function trackSettingHeight(
        node: HTMLElement,
        settingIndex: number,
    ) {
        let activeIndex = settingIndex;
        let resizeObserver: ResizeObserver | null = null;
        let scheduledWriteFrame = 0;
        let pendingHeight: number | null = null;

        const commitHeight = (nextHeight: number) => {
            if (readSettingHeights()[activeIndex] === nextHeight) {
                return;
            }

            writeSettingHeights({
                ...readSettingHeights(),
                [activeIndex]: nextHeight,
            });
        };

        const flushPendingHeight = () => {
            scheduledWriteFrame = 0;
            if (pendingHeight === null) {
                return;
            }

            const nextHeight = pendingHeight;
            pendingHeight = null;
            commitHeight(nextHeight);
        };

        const scheduleWriteHeight = (nextHeight: number) => {
            pendingHeight = nextHeight;

            if (scheduledWriteFrame !== 0) {
                return;
            }

            scheduledWriteFrame = requestAnimationFrame(flushPendingHeight);
        };

        const measureHeight = () => {
            scheduleWriteHeight(Math.ceil(node.offsetHeight));
        };

        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];
                const observedBlockSize =
                    entry === undefined ? null : readObservedBlockSize(entry);

                if (observedBlockSize === null) {
                    measureHeight();
                    return;
                }

                scheduleWriteHeight(Math.ceil(observedBlockSize));
            });
            resizeObserver.observe(node);
        }

        measureHeight();

        return {
            update(nextIndex: number) {
                activeIndex = nextIndex;
                measureHeight();
            },
            destroy() {
                resizeObserver?.disconnect();
                if (scheduledWriteFrame !== 0) {
                    cancelAnimationFrame(scheduledWriteFrame);
                }
            },
        };
    };
}

export function scrollbarHoverSurface(node: HTMLElement) {
    let hovered = false;
    let verticalOverflow = false;
    let lastPointerX = 0;
    let rect = node.getBoundingClientRect();
    let rafId = 0;

    const hasVerticalOverflow = () => node.scrollHeight > node.clientHeight + 1;
    const applyScrollState = () => {
        node.classList.toggle("surface-scrolled", node.scrollTop > 0);
    };
    const refreshRect = () => {
        rect = node.getBoundingClientRect();
    };

    const applyState = () => {
        rafId = 0;
        verticalOverflow = hasVerticalOverflow();

        if (!hovered || !verticalOverflow) {
            node.classList.remove("scrollbar-strong");
            return;
        }

        const viewportWidth =
            typeof window === "undefined" ? rect.right : window.innerWidth;
        const distanceToRight = viewportWidth - lastPointerX;
        const distanceToSurfaceRight = rect.right - lastPointerX;
        const nearViewportEdge = distanceToRight <= 28;
        const insideSurface =
            lastPointerX >= rect.left && lastPointerX <= rect.right;
        const nearSurfaceScrollbar =
            insideSurface && distanceToSurfaceRight >= 0 && distanceToSurfaceRight <= 22;

        node.classList.toggle(
            "scrollbar-strong",
            nearViewportEdge || nearSurfaceScrollbar,
        );
    };

    const scheduleApplyState = () => {
        if (rafId !== 0) {
            return;
        }

        rafId = requestAnimationFrame(applyState);
    };

    const invalidateRect = () => {
        refreshRect();
        scheduleApplyState();
    };

    const onPointerEnter = (event: PointerEvent) => {
        hovered = true;
        lastPointerX = event.clientX;
        refreshRect();
        scheduleApplyState();
    };

    const onPointerMove = (event: PointerEvent) => {
        lastPointerX = event.clientX;
        scheduleApplyState();
    };

    const onPointerLeave = () => {
        hovered = false;
        scheduleApplyState();
    };

    const onScroll = () => {
        applyScrollState();
        scheduleApplyState();
    };

    const resizeObserver = new ResizeObserver(() => {
        refreshRect();
        applyScrollState();
        scheduleApplyState();
    });
    resizeObserver.observe(node);

    applyScrollState();
    scheduleApplyState();

    window.addEventListener("resize", invalidateRect, { passive: true });
    window.addEventListener("scroll", invalidateRect, {
        passive: true,
        capture: true,
    });
    node.addEventListener("pointerenter", onPointerEnter);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerleave", onPointerLeave);
    node.addEventListener("scroll", onScroll);

    return {
        destroy() {
            resizeObserver.disconnect();
            window.removeEventListener("resize", invalidateRect);
            window.removeEventListener("scroll", invalidateRect, true);
            node.removeEventListener("pointerenter", onPointerEnter);
            node.removeEventListener("pointermove", onPointerMove);
            node.removeEventListener("pointerleave", onPointerLeave);
            node.removeEventListener("scroll", onScroll);

            if (rafId !== 0) {
                cancelAnimationFrame(rafId);
            }

            node.classList.remove("scrollbar-strong");
            node.classList.remove("surface-scrolled");
        },
    };
}
