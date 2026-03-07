<script lang="ts">
    import type { RevealItemOptions } from "fluent-reveal-svelte";
    import type { CurveSetting, Vec2 } from "../../../integration/types";
    import { getBounds } from "./numericSettingUtils";
    import {
        Chart,
        LineController,
        LineElement,
        LinearScale,
        PointElement,
        ScatterController,
        type Chart as ChartJS,
    } from "chart.js";
    import dragDataPlugin from "chartjs-plugin-dragdata";
    import { onDestroy, onMount } from "svelte";

    interface Props {
        setting: CurveSetting;
        onChange?: (value: Vec2[]) => void;
        revealItemOptions?: RevealItemOptions;
    }

    interface CurvePoint {
        x: number;
        y: number;
    }

    interface DragDataOptions {
        dragX: boolean;
        onDragStart?: () => void;
        onDrag?: (
            event: unknown,
            datasetIndex: number,
            pointIndex: number,
            nextPointValue: CurvePoint,
        ) => void;
        onDragEnd?: (
            event: unknown,
            datasetIndex: number,
            pointIndex: number,
            nextPointValue: CurvePoint,
        ) => void;
    }

    type CurveChart = ChartJS<"line", CurvePoint[], unknown>;

    const defaultChangeHandler = (_nextValue: Vec2[]) => {};
    const EPS = 1e-9;
    const EDGE_MARGIN = 1e-6;

    let {
        setting,
        onChange = defaultChangeHandler,
        revealItemOptions: _revealItemOptions,
    }: Props = $props();

    let canvasElement = $state<HTMLCanvasElement | null>(null);
    let chart = $state<CurveChart | null>(null);
    let isDragging = $state(false);
    let chartErrorMessage = $state<string | null>(null);

    const xBounds = $derived(getBounds(setting.xAxis.range));
    const yBounds = $derived(getBounds(setting.yAxis.range));

    Chart.register(
        LinearScale,
        PointElement,
        LineElement,
        LineController,
        ScatterController,
        dragDataPlugin,
    );

    function clamp(value: number, min: number, max: number): number {
        return Math.min(max, Math.max(min, value));
    }

    function toFiniteValue(
        value: number | undefined,
        axisLabel: string,
    ): number {
        if (value === undefined || !Number.isFinite(value)) {
            throw new Error(
                `CURVE setting "${setting.name}" produced an invalid ${axisLabel}-axis position.`,
            );
        }

        return value;
    }

    function sortPoints(points: CurvePoint[]): CurvePoint[] {
        return points.sort((left, right) => left.x - right.x);
    }

    function midpointYValue(): number {
        return yBounds.min + (yBounds.max - yBounds.min) / 2;
    }

    function normalizePoint(point: Vec2, pointIndex: number): CurvePoint {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
            throw new Error(
                `CURVE setting "${setting.name}" has non-finite point at index ${pointIndex}: (${point.x}, ${point.y}).`,
            );
        }

        return {
            x: clamp(point.x, xBounds.min, xBounds.max),
            y: clamp(point.y, yBounds.min, yBounds.max),
        };
    }

    function ensureEndpoints(points: CurvePoint[]): CurvePoint[] {
        const pointsWithEndpoints = [...points];

        const hasMinEndpoint = pointsWithEndpoints.some(
            (point) => Math.abs(point.x - xBounds.min) <= EPS,
        );
        const hasMaxEndpoint = pointsWithEndpoints.some(
            (point) => Math.abs(point.x - xBounds.max) <= EPS,
        );

        if (!hasMinEndpoint) {
            pointsWithEndpoints.push({
                x: xBounds.min,
                y: midpointYValue(),
            });
        }

        if (!hasMaxEndpoint) {
            pointsWithEndpoints.push({
                x: xBounds.max,
                y: midpointYValue(),
            });
        }

        for (const point of pointsWithEndpoints) {
            if (Math.abs(point.x - xBounds.min) <= EPS) {
                point.x = xBounds.min;
            }

            if (Math.abs(point.x - xBounds.max) <= EPS) {
                point.x = xBounds.max;
            }
        }

        return sortPoints(pointsWithEndpoints);
    }

    function normalizedCurvePoints(points: Vec2[]): CurvePoint[] {
        const normalizedPoints = points.map((point, pointIndex) =>
            normalizePoint(point, pointIndex),
        );
        return ensureEndpoints(normalizedPoints);
    }

    function syncChartFromSetting() {
        if (chart === null) {
            return;
        }

        const dataset = chart.data.datasets[0];
        if (dataset === undefined) {
            return;
        }
        dataset.data = normalizedCurvePoints(setting.value);
        dataset.tension = setting.tension;

        const scales = chart.options.scales;
        if (scales === undefined) {
            throw new Error(
                `CURVE setting "${setting.name}" chart scales are missing.`,
            );
        }

        const xScale = scales.x;
        const yScale = scales.y;
        if (
            xScale === undefined ||
            yScale === undefined ||
            typeof xScale === "boolean" ||
            typeof yScale === "boolean"
        ) {
            throw new Error(
                `CURVE setting "${setting.name}" chart scale config is invalid.`,
            );
        }

        xScale.min = xBounds.min;
        xScale.max = xBounds.max;
        yScale.min = yBounds.min;
        yScale.max = yBounds.max;

        if ("title" in xScale && xScale.title !== undefined) {
            xScale.title.text = setting.xAxis.label;
        }

        if ("title" in yScale && yScale.title !== undefined) {
            yScale.title.text = setting.yAxis.label;
        }

        chart.update();
    }

    function emitCurrentValue() {
        if (chart === null) {
            return;
        }

        const dataset = chart.data.datasets[0];
        if (dataset === undefined) {
            return;
        }
        const nextValue = dataset.data.map((point) => ({
            x: point.x,
            y: point.y,
        }));

        onChange(nextValue);
    }

    function lockEdgePoints(previousPoint: CurvePoint, nextPoint: CurvePoint) {
        const minOpen = xBounds.min + EDGE_MARGIN;
        const maxOpen = xBounds.max - EDGE_MARGIN;
        const isMinEndpoint = Math.abs(previousPoint.x - xBounds.min) <= EPS;
        const isMaxEndpoint = Math.abs(previousPoint.x - xBounds.max) <= EPS;

        if (isMinEndpoint) {
            nextPoint.x = xBounds.min;
        } else if (isMaxEndpoint) {
            nextPoint.x = xBounds.max;
        } else {
            nextPoint.x = clamp(nextPoint.x, minOpen, maxOpen);
        }

        nextPoint.y = clamp(nextPoint.y, yBounds.min, yBounds.max);
    }

    function getPositionInChart(event: MouseEvent, curveChart: CurveChart) {
        const rect = curveChart.canvas.getBoundingClientRect();
        const xPixel = event.clientX - rect.left;
        const yPixel = event.clientY - rect.top;
        const xScale = curveChart.scales.x;
        const yScale = curveChart.scales.y;

        return {
            x: toFiniteValue(xScale.getValueForPixel(xPixel), "x"),
            y: toFiniteValue(yScale.getValueForPixel(yPixel), "y"),
        };
    }

    function addPoint(event: MouseEvent) {
        if (chart === null || isDragging) {
            return;
        }

        const dataset = chart.data.datasets[0];
        if (dataset === undefined) {
            return;
        }
        const position = getPositionInChart(event, chart);
        const minOpen = xBounds.min + EDGE_MARGIN;
        const maxOpen = xBounds.max - EDGE_MARGIN;

        dataset.data.push({
            x: clamp(position.x, minOpen, maxOpen),
            y: clamp(position.y, yBounds.min, yBounds.max),
        });
        dataset.data = ensureEndpoints(dataset.data);
        chart.update();
        emitCurrentValue();
    }

    function removePoint(event: MouseEvent) {
        event.preventDefault();

        if (chart === null) {
            return;
        }

        const hits = chart.getElementsAtEventForMode(
            event,
            "nearest",
            { intersect: true },
            true,
        );
        if (hits.length === 0) {
            return;
        }

        const { datasetIndex, index } = hits[0];
        const dataset = chart.data.datasets[datasetIndex];
        if (dataset === undefined) {
            return;
        }
        const point = dataset.data[index];
        if (point === undefined) {
            return;
        }
        const isMinEndpoint = Math.abs(point.x - xBounds.min) <= EPS;
        const isMaxEndpoint = Math.abs(point.x - xBounds.max) <= EPS;

        if (isMinEndpoint || isMaxEndpoint) {
            return;
        }

        dataset.data.splice(index, 1);
        dataset.data = ensureEndpoints(dataset.data);
        chart.update();
        emitCurrentValue();
    }

    onMount(() => {
        if (canvasElement === null) {
            chartErrorMessage = `CURVE setting "${setting.name}" could not find chart canvas element.`;
            return;
        }

        try {
            const context = canvasElement.getContext("2d");
            if (context === null) {
                throw new Error(
                    `CURVE setting "${setting.name}" failed to get 2D context.`,
                );
            }

            chart = new Chart(context, {
                type: "line",
                data: {
                    datasets: [
                        {
                            type: "line",
                            data: normalizedCurvePoints(setting.value),
                            showLine: true,
                            parsing: false,
                            borderWidth: 2,
                            borderColor: "#4677ff",
                            pointRadius: 5,
                            pointBackgroundColor: "#4677ff",
                            pointBorderWidth: 0,
                            pointHoverRadius: 6,
                            pointHoverBackgroundColor: "#4677ff",
                            tension: setting.tension,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: "linear",
                            min: xBounds.min,
                            max: xBounds.max,
                            title: {
                                display: true,
                                text: setting.xAxis.label,
                                color: "rgba(211, 211, 211, 1)",
                            },
                            grid: {
                                color: "#333333",
                            },
                            ticks: {
                                color: "rgba(211, 211, 211, 1)",
                            },
                        },
                        y: {
                            type: "linear",
                            min: yBounds.min,
                            max: yBounds.max,
                            title: {
                                display: true,
                                text: setting.yAxis.label,
                                color: "rgba(211, 211, 211, 1)",
                            },
                            grid: {
                                color: "#333333",
                            },
                            ticks: {
                                color: "rgba(211, 211, 211, 1)",
                            },
                        },
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: false,
                        },
                        dragData: {
                            dragX: true,
                            onDragStart: () => {
                                isDragging = true;
                            },
                            onDrag: (
                                _event: unknown,
                                datasetIndex: number,
                                pointIndex: number,
                                nextPointValue: CurvePoint,
                            ) => {
                                if (chart === null) {
                                    return;
                                }

                                const dataset = chart.data.datasets[datasetIndex];
                                if (dataset === undefined) {
                                    return;
                                }
                                const previousPoint = dataset.data[pointIndex];
                                if (previousPoint === undefined) {
                                    return;
                                }
                                lockEdgePoints(previousPoint, nextPointValue);
                            },
                            onDragEnd: (
                                _event: unknown,
                                datasetIndex: number,
                                pointIndex: number,
                                nextPointValue: CurvePoint,
                            ) => {
                                if (chart === null) {
                                    return;
                                }

                                const dataset = chart.data.datasets[datasetIndex];
                                if (dataset === undefined) {
                                    return;
                                }
                                const previousPoint = dataset.data[pointIndex];
                                if (previousPoint === undefined) {
                                    return;
                                }
                                lockEdgePoints(previousPoint, nextPointValue);
                                dataset.data = ensureEndpoints(dataset.data);
                                chart.update();
                                isDragging = false;
                                emitCurrentValue();
                            },
                        } as DragDataOptions,
                    },
                } as Record<string, unknown>,
            });
            chartErrorMessage = null;
        } catch (error) {
            chart = null;
            chartErrorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to initialize curve editor.";
        }
    });

    onDestroy(() => {
        chart?.destroy();
        chart = null;
    });

    $effect(() => {
        syncChartFromSetting();
    });
</script>

<div class="setting-input-shell setting-input-shell--block curve-setting-shell">
    <div class="curve-setting-layout">
        {#if chartErrorMessage !== null}
            <p class="curve-state curve-state--error" role="alert">
                {chartErrorMessage}
            </p>
        {:else}
            <div class="curve-canvas-shell">
                <canvas
                    class="curve-canvas"
                    bind:this={canvasElement}
                    onclick={addPoint}
                    oncontextmenu={removePoint}
                ></canvas>
            </div>
            <p class="curve-state">
                Click to add points, drag to move, right-click a point to remove.
            </p>
        {/if}
    </div>
</div>

<style lang="scss">
    @use "../../../colors.scss" as *;

    .curve-setting-shell {
        width: 100%;
    }

    .curve-setting-layout {
        display: grid;
        width: 100%;
        gap: 8px;
    }

    .curve-canvas-shell {
        position: relative;
        width: 100%;
        height: 180px;
        border: 1px solid rgba($clickgui-text-color, 0.26);
        background-color: rgba($clickgui-base-color, 0.36);
    }

    .curve-canvas {
        width: 100%;
        height: 100%;
    }

    .curve-state {
        margin: 0;
        font-size: 10px;
        letter-spacing: 0.04em;
        color: rgba($clickgui-text-dimmed-color, 0.9);
    }

    .curve-state--error {
        color: rgba($clickgui-text-color, 0.92);
    }
</style>
