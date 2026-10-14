import type { DataTag, DefinedInitialDataOptions, DefinedUseQueryResult, QueryClient, QueryKey, UndefinedInitialDataOptions, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { DashboardSummary, ErrorEnvelope, GetReportsOverviewParams, HealthStatus, ListOrdersParams, ListProductsParams, Notification, Order, OrderInput, OrderUpdate, PaymentMethod, PaymentMethodInput, Product, ProductInput, ProductUpdate, ReportsOverview, Rider, UploadUrlRequest, UploadUrlResponse } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: Parameters<typeof customFetch>[1]) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof healthCheck>>, TError, Awaited<ReturnType<typeof healthCheck>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof healthCheck>>, TError, Awaited<ReturnType<typeof healthCheck>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getListProductsUrl: (params?: ListProductsParams) => string;
/**
 * @summary List store products
 */
export declare const listProducts: (params?: ListProductsParams, options?: Parameters<typeof customFetch>[1]) => Promise<Product[]>;
export declare const getListProductsQueryKey: (params?: ListProductsParams) => readonly ["/api/products", ...ListProductsParams[]];
export declare const getListProductsQueryOptions: <TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type ListProductsQueryResult = NonNullable<Awaited<ReturnType<typeof listProducts>>>;
export type ListProductsQueryError = ErrorType<unknown>;
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params: undefined | ListProductsParams, options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof listProducts>>, TError, Awaited<ReturnType<typeof listProducts>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof listProducts>>, TError, Awaited<ReturnType<typeof listProducts>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListProducts<TData = Awaited<ReturnType<typeof listProducts>>, TError = ErrorType<unknown>>(params?: ListProductsParams, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listProducts>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getCreateProductUrl: () => string;
/**
 * @summary Add a product to the catalog
 */
export declare const createProduct: (productInput: ProductInput, options?: Parameters<typeof customFetch>[1]) => Promise<Product>;
export declare const getCreateProductMutationKey: () => readonly ["createProduct"];
export declare const getCreateProductMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, CreateProductMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, CreateProductMutationVariables, TContext>;
export type CreateProductMutationResult = NonNullable<Awaited<ReturnType<typeof createProduct>>>;
export type CreateProductMutationBody = BodyType<ProductInput>;
export type CreateProductMutationError = ErrorType<unknown>;
export type CreateProductMutationVariables = {
    data: BodyType<ProductInput>;
};
/**
* @summary Add a product to the catalog
*/
export declare const useCreateProduct: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProduct>>, TError, CreateProductMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof createProduct>>, TError, CreateProductMutationVariables, TContext>;
export declare const getUpdateProductUrl: (id: number) => string;
/**
 * @summary Update a product
 */
export declare const updateProduct: (id: number, productUpdate: ProductUpdate, options?: Parameters<typeof customFetch>[1]) => Promise<Product>;
export declare const getUpdateProductMutationKey: () => readonly ["updateProduct"];
export declare const getUpdateProductMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, UpdateProductMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, UpdateProductMutationVariables, TContext>;
export type UpdateProductMutationResult = NonNullable<Awaited<ReturnType<typeof updateProduct>>>;
export type UpdateProductMutationBody = BodyType<ProductUpdate>;
export type UpdateProductMutationError = ErrorType<void>;
export type UpdateProductMutationVariables = {
    id: number;
    data: BodyType<ProductUpdate>;
};
/**
* @summary Update a product
*/
export declare const useUpdateProduct: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProduct>>, TError, UpdateProductMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof updateProduct>>, TError, UpdateProductMutationVariables, TContext>;
export declare const getDeleteProductUrl: (id: number) => string;
/**
 * @summary Remove a product from the catalog
 */
export declare const deleteProduct: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<void>;
export declare const getDeleteProductMutationKey: () => readonly ["deleteProduct"];
export declare const getDeleteProductMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, DeleteProductMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, DeleteProductMutationVariables, TContext>;
export type DeleteProductMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProduct>>>;
export type DeleteProductMutationError = ErrorType<void>;
export type DeleteProductMutationVariables = {
    id: number;
};
/**
* @summary Remove a product from the catalog
*/
export declare const useDeleteProduct: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProduct>>, TError, DeleteProductMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof deleteProduct>>, TError, DeleteProductMutationVariables, TContext>;
export declare const getListOrdersUrl: (params?: ListOrdersParams) => string;
/**
 * @summary List orders visible to the authenticated account
 */
export declare const listOrders: (params?: ListOrdersParams, options?: Parameters<typeof customFetch>[1]) => Promise<Order[]>;
export declare const getListOrdersQueryKey: (params?: ListOrdersParams) => readonly ["/api/orders", ...ListOrdersParams[]];
export declare const getListOrdersQueryOptions: <TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(params?: ListOrdersParams, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type ListOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listOrders>>>;
export type ListOrdersQueryError = ErrorType<unknown>;
export declare function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(params: undefined | ListOrdersParams, options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof listOrders>>, TError, Awaited<ReturnType<typeof listOrders>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(params?: ListOrdersParams, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof listOrders>>, TError, Awaited<ReturnType<typeof listOrders>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(params?: ListOrdersParams, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getCreateOrderUrl: () => string;
/**
 * @summary Place an order
 */
export declare const createOrder: (orderInput: OrderInput, options?: Parameters<typeof customFetch>[1]) => Promise<Order>;
export declare const getCreateOrderMutationKey: () => readonly ["createOrder"];
export declare const getCreateOrderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError, CreateOrderMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError, CreateOrderMutationVariables, TContext>;
export type CreateOrderMutationResult = NonNullable<Awaited<ReturnType<typeof createOrder>>>;
export type CreateOrderMutationBody = BodyType<OrderInput>;
export type CreateOrderMutationError = ErrorType<unknown>;
export type CreateOrderMutationVariables = {
    data: BodyType<OrderInput>;
};
/**
* @summary Place an order
*/
export declare const useCreateOrder: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError, CreateOrderMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof createOrder>>, TError, CreateOrderMutationVariables, TContext>;
export declare const getGetOrderUrl: (id: number) => string;
/**
 * @summary Get an order with tracking timeline
 */
export declare const getOrder: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<Order>;
export declare const getGetOrderQueryKey: (id: number) => readonly [`/api/orders/${number}`];
export declare const getGetOrderQueryOptions: <TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<void>>(id: number, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type GetOrderQueryResult = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
export type GetOrderQueryError = ErrorType<void>;
export declare function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<void>>(id: number, options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof getOrder>>, TError, Awaited<ReturnType<typeof getOrder>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<void>>(id: number, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof getOrder>>, TError, Awaited<ReturnType<typeof getOrder>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<void>>(id: number, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getUpdateOrderStatusUrl: (id: number) => string;
/**
 * @summary Change order status or rider assignment
 */
export declare const updateOrderStatus: (id: number, orderUpdate: OrderUpdate, options?: Parameters<typeof customFetch>[1]) => Promise<Order>;
export declare const getUpdateOrderStatusMutationKey: () => readonly ["updateOrderStatus"];
export declare const getUpdateOrderStatusMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOrderStatus>>, TError, UpdateOrderStatusMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateOrderStatus>>, TError, UpdateOrderStatusMutationVariables, TContext>;
export type UpdateOrderStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateOrderStatus>>>;
export type UpdateOrderStatusMutationBody = BodyType<OrderUpdate>;
export type UpdateOrderStatusMutationError = ErrorType<void>;
export type UpdateOrderStatusMutationVariables = {
    id: number;
    data: BodyType<OrderUpdate>;
};
/**
* @summary Change order status or rider assignment
*/
export declare const useUpdateOrderStatus: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOrderStatus>>, TError, UpdateOrderStatusMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof updateOrderStatus>>, TError, UpdateOrderStatusMutationVariables, TContext>;
export declare const getSubmitOrderPaymentUrl: (id: number) => string;
/**
 * @summary Tell the market that payment was sent
 */
export declare const submitOrderPayment: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<Order>;
export declare const getSubmitOrderPaymentMutationKey: () => readonly ["submitOrderPayment"];
export declare const getSubmitOrderPaymentMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitOrderPayment>>, TError, SubmitOrderPaymentMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitOrderPayment>>, TError, SubmitOrderPaymentMutationVariables, TContext>;
export type SubmitOrderPaymentMutationResult = NonNullable<Awaited<ReturnType<typeof submitOrderPayment>>>;
export type SubmitOrderPaymentMutationError = ErrorType<void>;
export type SubmitOrderPaymentMutationVariables = {
    id: number;
};
/**
* @summary Tell the market that payment was sent
*/
export declare const useSubmitOrderPayment: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitOrderPayment>>, TError, SubmitOrderPaymentMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof submitOrderPayment>>, TError, SubmitOrderPaymentMutationVariables, TContext>;
export declare const getConfirmOrderPaymentUrl: (id: number) => string;
/**
 * @summary Confirm that an order payment has arrived
 */
export declare const confirmOrderPayment: (id: number, options?: Parameters<typeof customFetch>[1]) => Promise<Order>;
export declare const getConfirmOrderPaymentMutationKey: () => readonly ["confirmOrderPayment"];
export declare const getConfirmOrderPaymentMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmOrderPayment>>, TError, ConfirmOrderPaymentMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof confirmOrderPayment>>, TError, ConfirmOrderPaymentMutationVariables, TContext>;
export type ConfirmOrderPaymentMutationResult = NonNullable<Awaited<ReturnType<typeof confirmOrderPayment>>>;
export type ConfirmOrderPaymentMutationError = ErrorType<void>;
export type ConfirmOrderPaymentMutationVariables = {
    id: number;
};
/**
* @summary Confirm that an order payment has arrived
*/
export declare const useConfirmOrderPayment: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof confirmOrderPayment>>, TError, ConfirmOrderPaymentMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof confirmOrderPayment>>, TError, ConfirmOrderPaymentMutationVariables, TContext>;
export declare const getListPaymentMethodsUrl: () => string;
/**
 * @summary List customer payment destinations enabled by the admin
 */
export declare const listPaymentMethods: (options?: Parameters<typeof customFetch>[1]) => Promise<PaymentMethod[]>;
export declare const getListPaymentMethodsQueryKey: () => readonly ["/api/payment-methods"];
export declare const getListPaymentMethodsQueryOptions: <TData = Awaited<ReturnType<typeof listPaymentMethods>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type ListPaymentMethodsQueryResult = NonNullable<Awaited<ReturnType<typeof listPaymentMethods>>>;
export type ListPaymentMethodsQueryError = ErrorType<unknown>;
export declare function useListPaymentMethods<TData = Awaited<ReturnType<typeof listPaymentMethods>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, Awaited<ReturnType<typeof listPaymentMethods>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListPaymentMethods<TData = Awaited<ReturnType<typeof listPaymentMethods>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, Awaited<ReturnType<typeof listPaymentMethods>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListPaymentMethods<TData = Awaited<ReturnType<typeof listPaymentMethods>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listPaymentMethods>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getListAdminPaymentMethodsUrl: () => string;
/**
 * @summary List all payment methods and their setup status
 */
export declare const listAdminPaymentMethods: (options?: Parameters<typeof customFetch>[1]) => Promise<PaymentMethod[]>;
export declare const getListAdminPaymentMethodsQueryKey: () => readonly ["/api/admin/payment-methods"];
export declare const getListAdminPaymentMethodsQueryOptions: <TData = Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type ListAdminPaymentMethodsQueryResult = NonNullable<Awaited<ReturnType<typeof listAdminPaymentMethods>>>;
export type ListAdminPaymentMethodsQueryError = ErrorType<unknown>;
export declare function useListAdminPaymentMethods<TData = Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError, Awaited<ReturnType<typeof listAdminPaymentMethods>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListAdminPaymentMethods<TData = Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError, Awaited<ReturnType<typeof listAdminPaymentMethods>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListAdminPaymentMethods<TData = Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listAdminPaymentMethods>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getUpdatePaymentMethodUrl: (method: "paypal" | "zelle" | "bank") => string;
/**
 * @summary Save or enable a manual payment method
 */
export declare const updatePaymentMethod: (method: "paypal" | "zelle" | "bank", paymentMethodInput: PaymentMethodInput, options?: Parameters<typeof customFetch>[1]) => Promise<PaymentMethod>;
export declare const getUpdatePaymentMethodMutationKey: () => readonly ["updatePaymentMethod"];
export declare const getUpdatePaymentMethodMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePaymentMethod>>, TError, UpdatePaymentMethodMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePaymentMethod>>, TError, UpdatePaymentMethodMutationVariables, TContext>;
export type UpdatePaymentMethodMutationResult = NonNullable<Awaited<ReturnType<typeof updatePaymentMethod>>>;
export type UpdatePaymentMethodMutationBody = BodyType<PaymentMethodInput>;
export type UpdatePaymentMethodMutationError = ErrorType<void>;
export type UpdatePaymentMethodMutationVariables = {
    method: 'paypal' | 'zelle' | 'bank';
    data: BodyType<PaymentMethodInput>;
};
/**
* @summary Save or enable a manual payment method
*/
export declare const useUpdatePaymentMethod: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePaymentMethod>>, TError, UpdatePaymentMethodMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof updatePaymentMethod>>, TError, UpdatePaymentMethodMutationVariables, TContext>;
export declare const getGetDashboardSummaryUrl: () => string;
/**
 * @summary Get operations dashboard summary
 */
export declare const getDashboardSummary: (options?: Parameters<typeof customFetch>[1]) => Promise<DashboardSummary>;
export declare const getGetDashboardSummaryQueryKey: () => readonly ["/api/dashboard/summary"];
export declare const getGetDashboardSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type GetDashboardSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardSummary>>>;
export type GetDashboardSummaryQueryError = ErrorType<unknown>;
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, Awaited<ReturnType<typeof getDashboardSummary>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, Awaited<ReturnType<typeof getDashboardSummary>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetDashboardSummary<TData = Awaited<ReturnType<typeof getDashboardSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getDashboardSummary>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getListRidersUrl: () => string;
/**
 * @summary List available riders
 */
export declare const listRiders: (options?: Parameters<typeof customFetch>[1]) => Promise<Rider[]>;
export declare const getListRidersQueryKey: () => readonly ["/api/riders"];
export declare const getListRidersQueryOptions: <TData = Awaited<ReturnType<typeof listRiders>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listRiders>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listRiders>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type ListRidersQueryResult = NonNullable<Awaited<ReturnType<typeof listRiders>>>;
export type ListRidersQueryError = ErrorType<unknown>;
export declare function useListRiders<TData = Awaited<ReturnType<typeof listRiders>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof listRiders>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof listRiders>>, TError, Awaited<ReturnType<typeof listRiders>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListRiders<TData = Awaited<ReturnType<typeof listRiders>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listRiders>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof listRiders>>, TError, Awaited<ReturnType<typeof listRiders>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListRiders<TData = Awaited<ReturnType<typeof listRiders>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listRiders>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getListNotificationsUrl: () => string;
/**
 * @summary List recent arrival and order notifications
 */
export declare const listNotifications: (options?: Parameters<typeof customFetch>[1]) => Promise<Notification[]>;
export declare const getListNotificationsQueryKey: () => readonly ["/api/notifications"];
export declare const getListNotificationsQueryOptions: <TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type ListNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof listNotifications>>>;
export type ListNotificationsQueryError = ErrorType<unknown>;
export declare function useListNotifications<TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof listNotifications>>, TError, Awaited<ReturnType<typeof listNotifications>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListNotifications<TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof listNotifications>>, TError, Awaited<ReturnType<typeof listNotifications>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useListNotifications<TData = Awaited<ReturnType<typeof listNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof listNotifications>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getGetReportsOverviewUrl: (params?: GetReportsOverviewParams) => string;
/**
 * @summary Get admin reports overview
 */
export declare const getReportsOverview: (params?: GetReportsOverviewParams, options?: Parameters<typeof customFetch>[1]) => Promise<ReportsOverview>;
export declare const getGetReportsOverviewQueryKey: (params?: GetReportsOverviewParams) => readonly ["/api/reports/overview", ...GetReportsOverviewParams[]];
export declare const getGetReportsOverviewQueryOptions: <TData = Awaited<ReturnType<typeof getReportsOverview>>, TError = ErrorType<unknown>>(params?: GetReportsOverviewParams, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getReportsOverview>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getReportsOverview>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type GetReportsOverviewQueryResult = NonNullable<Awaited<ReturnType<typeof getReportsOverview>>>;
export type GetReportsOverviewQueryError = ErrorType<unknown>;
export declare function useGetReportsOverview<TData = Awaited<ReturnType<typeof getReportsOverview>>, TError = ErrorType<unknown>>(params: undefined | GetReportsOverviewParams, options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof getReportsOverview>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof getReportsOverview>>, TError, Awaited<ReturnType<typeof getReportsOverview>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetReportsOverview<TData = Awaited<ReturnType<typeof getReportsOverview>>, TError = ErrorType<unknown>>(params?: GetReportsOverviewParams, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getReportsOverview>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof getReportsOverview>>, TError, Awaited<ReturnType<typeof getReportsOverview>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetReportsOverview<TData = Awaited<ReturnType<typeof getReportsOverview>>, TError = ErrorType<unknown>>(params?: GetReportsOverviewParams, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getReportsOverview>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare const getRequestUploadUrlUrl: () => string;
/**
 * @summary Request a presigned URL for a product image upload
 */
export declare const requestUploadUrl: (uploadUrlRequest: UploadUrlRequest, options?: Parameters<typeof customFetch>[1]) => Promise<UploadUrlResponse>;
export declare const getRequestUploadUrlMutationKey: () => readonly ["requestUploadUrl"];
export declare const getRequestUploadUrlMutationOptions: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
export type RequestUploadUrlMutationResult = NonNullable<Awaited<ReturnType<typeof requestUploadUrl>>>;
export type RequestUploadUrlMutationBody = BodyType<UploadUrlRequest>;
export type RequestUploadUrlMutationError = ErrorType<ErrorEnvelope>;
export type RequestUploadUrlMutationVariables = {
    data: BodyType<UploadUrlRequest>;
};
/**
* @summary Request a presigned URL for a product image upload
*/
export declare const useRequestUploadUrl: <TError = ErrorType<ErrorEnvelope>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient) => UseMutationResult<Awaited<ReturnType<typeof requestUploadUrl>>, TError, RequestUploadUrlMutationVariables, TContext>;
export declare const getGetStorageObjectUrl: (objectPath: string) => string;
/**
 * @summary Serve a product image object
 */
export declare const getStorageObject: (objectPath: string, options?: Parameters<typeof customFetch>[1]) => Promise<Blob>;
export declare const getGetStorageObjectQueryKey: (objectPath: string) => readonly [`/api/storage/objects/${string}`];
export declare const getGetStorageObjectQueryOptions: <TData = Awaited<ReturnType<typeof getStorageObject>>, TError = ErrorType<ErrorEnvelope>>(objectPath: string, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export type GetStorageObjectQueryResult = NonNullable<Awaited<ReturnType<typeof getStorageObject>>>;
export type GetStorageObjectQueryError = ErrorType<ErrorEnvelope>;
export declare function useGetStorageObject<TData = Awaited<ReturnType<typeof getStorageObject>>, TError = ErrorType<ErrorEnvelope>>(objectPath: string, options: {
    query: Partial<UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData>> & Pick<DefinedInitialDataOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, Awaited<ReturnType<typeof getStorageObject>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetStorageObject<TData = Awaited<ReturnType<typeof getStorageObject>>, TError = ErrorType<ErrorEnvelope>>(objectPath: string, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData>> & Pick<UndefinedInitialDataOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, Awaited<ReturnType<typeof getStorageObject>>>, 'initialData'>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export declare function useGetStorageObject<TData = Awaited<ReturnType<typeof getStorageObject>>, TError = ErrorType<ErrorEnvelope>>(objectPath: string, options?: {
    query?: Partial<UseQueryOptions<Awaited<ReturnType<typeof getStorageObject>>, TError, TData>>;
    request?: SecondParameter<typeof customFetch>;
}, queryClient?: QueryClient): UseQueryResult<TData, TError> & {
    queryKey: DataTag<QueryKey, TData, TError>;
};
export {};
//# sourceMappingURL=api.d.ts.map