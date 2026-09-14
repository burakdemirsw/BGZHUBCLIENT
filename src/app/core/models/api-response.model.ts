/**
 * C# backend ApiResponse<T> sınıfının frontend karşılığı.
 * Tüm API yanıtları bu wrapper içinde döner.
 */
export class ApiResponse<T> {
    statusCode: number;
    data: T | null;
    dataCount: number | null;
    traceId: string | null;
    errorCode: string | null;
    innerError: string | null;

    constructor(init?: Partial<ApiResponse<T>>) {
        this.statusCode = init?.statusCode ?? 0;
        this.data = init?.data ?? null;
        this.dataCount = init?.dataCount ?? null;
        this.traceId = init?.traceId ?? null;
        this.errorCode = init?.errorCode ?? null;
        this.innerError = init?.innerError ?? null;
    }

    /** Yanıt başarılı mı? (2xx) */
    get isSuccess(): boolean {
        return this.statusCode >= 200 && this.statusCode < 300;
    }

    /**
     * Ham API yanıtını ApiResponse nesnesine dönüştürür.
     * HttpClientService'den gelen raw JSON'u parse eder.
     */
    static from<T>(response: any): ApiResponse<T> {
        if (response instanceof ApiResponse) return response;

        const isObjectLike = response !== null && typeof response === 'object';
        const hasWrapperShape = isObjectLike && (
            'statusCode' in response
            || 'data' in response
            || 'traceId' in response
            || 'errorCode' in response
            || 'innerError' in response
            || 'StatusCode' in response
            || 'Data' in response
            || 'TraceId' in response
            || 'ErrorCode' in response
            || 'InnerError' in response
        );

        if (!hasWrapperShape) {
            return new ApiResponse<T>({
                statusCode: 200,
                data: response as T,
                dataCount: Array.isArray(response) ? response.length : null,
            });
        }

        return new ApiResponse<T>({
            statusCode: response?.statusCode ?? response?.StatusCode ?? 200,
            data: response?.data ?? response?.Data ?? null,
            dataCount: response?.dataCount ?? response?.DataCount ?? null,
            traceId: response?.traceId ?? response?.TraceId ?? null,
            errorCode: response?.errorCode ?? response?.ErrorCode ?? null,
            innerError: response?.innerError ?? response?.InnerError ?? null,
        });
    }
}
